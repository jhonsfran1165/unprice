import { type Database, type TransactionDatabase, and, eq } from "@unprice/db"
import { customerCredits, invoices } from "@unprice/db/schema"
import { type FeatureType, newId } from "@unprice/db/utils"
import {
  type CalculatedPrice,
  type InvoiceStatus,
  type InvoiceType,
  type SubscriptionInvoice,
  type WhenToBill,
  calculatePricePerFeature,
  configureBillingCycleSubscription,
} from "@unprice/db/validators"
import { Err, Ok, type Result } from "@unprice/error"
import type { Logger } from "@unprice/logging"
import type { Analytics } from "@unprice/tinybird"
import { StateMachine } from "../machine/service"
import { PaymentProviderService } from "../payment-provider"
import type { PaymentProviderInvoice } from "../payment-provider/interface"
import { UnPriceSubscriptionError } from "./errors"
import type { PhaseMachine } from "./phase-machine"

// all event operate with the now parameter which is the timestamp of the event
// this allows us to handle the events in a deterministic way
// also allow us to mock future events for testing purposes, like when we want to test the subscription renewal, invoices, etc
export type InvoiceEventMap<S extends string> = {
  FINALIZE_INVOICE: {
    payload: { now: number; invoiceId: string }
    result: { status: S; paymentStatus: InvoiceStatus; retries: number; invoiceId: string }
    error: UnPriceSubscriptionError
  }
  COLLECT_PAYMENT: {
    payload: { now: number; invoiceId: string; autoFinalize: boolean }
    result: {
      status: S
      paymentStatus: InvoiceStatus
      retries: number
      invoiceId: string
      total: number
      paymentInvoiceId?: string
    }
    error: UnPriceSubscriptionError
  }
  PRORATE_INVOICE: {
    payload: { now: number; invoiceId: string; startAt: number; endAt: number }
    result: { status: S }
    error: UnPriceSubscriptionError
  }
}

export class InvoiceStateMachine extends StateMachine<
  InvoiceStatus,
  InvoiceEventMap<InvoiceStatus>,
  keyof InvoiceEventMap<InvoiceStatus>
> {
  private readonly phaseMachine: PhaseMachine
  private readonly db: Database | TransactionDatabase
  private readonly logger: Logger
  private readonly paymentProviderService: PaymentProviderService
  private readonly analytics: Analytics
  private readonly isTest: boolean

  constructor({
    db,
    phaseMachine,
    logger,
    analytics,
    isTest = false,
    invoice,
    paymentProviderToken,
  }: {
    db: Database | TransactionDatabase
    phaseMachine: PhaseMachine
    logger: Logger
    analytics: Analytics
    isTest?: boolean
    invoice: SubscriptionInvoice
    paymentProviderToken: string
  }) {
    // the initial state of the machine
    const isFinalState = ["paid", "void", "failed"].includes(invoice.status)
    super(invoice.status, isFinalState)

    this.phaseMachine = phaseMachine
    this.db = db
    this.logger = logger
    this.analytics = analytics
    this.isTest = isTest ?? false

    this.paymentProviderService = new PaymentProviderService({
      customer: this.phaseMachine.getCustomer(),
      paymentProvider: invoice.paymentProvider,
      logger,
      token: paymentProviderToken,
    })

    /*
     * FINALIZE_INVOICE
     * finalize the invoice for the subscription phase
     */
    this.addTransition({
      from: ["draft"],
      to: ["unpaid"],
      event: "FINALIZE_INVOICE",
      onTransition: async (payload) => {
        const invoice = await this.getInvoice(payload.invoiceId)

        if (!invoice) {
          return Err(new UnPriceSubscriptionError({ message: "Invoice not found" }))
        }

        const result = await this.finalizeInvoice({
          invoice,
          now: payload.now,
        })

        if (result.err) {
          return Err(result.err)
        }

        // wait for the payment
        return Ok({
          status: result.val.invoice.status,
          paymentStatus: result.val.invoice.status,
          retries: result.val.invoice.paymentAttempts?.length ?? 0,
          invoiceId: invoice.id,
        })
      },
    })

    /*
     * PRORATE_INVOICE
     * pro rate the invoice for the subscription phase
     */
    this.addTransition({
      from: ["draft"],
      to: ["unpaid"],
      event: "PRORATE_INVOICE",
      onTransition: async (payload) => {
        const result = await this.prorateInvoice({
          invoiceId: payload.invoiceId,
          startAt: payload.startAt,
          endAt: payload.endAt,
        })

        if (result.err) {
          return Err(result.err)
        }

        // wait for the payment
        return Ok({
          status: "unpaid",
        })
      },
    })

    /*
     * COLLECT_PAYMENT
     * collect the payment for the invoice
     */
    this.addTransition({
      // support draft because we can auto finalize the invoice and then collect the payment
      from: ["unpaid", "waiting", "draft"],
      to: ["paid", "failed", "void"],
      event: "COLLECT_PAYMENT",
      onTransition: async (payload) => {
        const invoice = await this.getInvoice(payload.invoiceId)

        if (!invoice) {
          return Err(new UnPriceSubscriptionError({ message: "Invoice not found" }))
        }

        const result = await this.collectInvoicePayment({
          invoice,
          now: payload.now,
          autoFinalize: payload.autoFinalize,
        })

        if (result.err) {
          return Err(result.err)
        }

        return Ok({
          status: result.val.status,
          paymentStatus: result.val.status,
          retries: result.val.retries,
          invoiceId: invoice.id,
          total: result.val.total,
          paymentInvoiceId: result.val.paymentInvoiceId,
        })
      },
    })
  }

  private async getInvoice(invoiceId: string): Promise<SubscriptionInvoice | undefined> {
    const invoice = await this.db.query.invoices.findFirst({
      where: (table, { eq }) => eq(table.id, invoiceId),
    })

    return invoice
  }

  // given an invoice that is already paid, we need to prorate the flat charges
  // this is normally done when a phase is canceled mid cycle and the when to invoice is pay in advance
  private async prorateInvoice({
    invoiceId,
    startAt,
    endAt,
  }: {
    invoiceId: string
    startAt: number
    endAt: number
  }): Promise<Result<void, UnPriceSubscriptionError>> {
    // get the invoice
    const invoice = await this.getInvoice(invoiceId)
    const customer = this.phaseMachine.getCustomer()

    if (!invoice) {
      return Err(new UnPriceSubscriptionError({ message: `Invoice ${invoiceId} not found` }))
    }

    if (!["paid", "void"].includes(invoice.status)) {
      return Err(
        new UnPriceSubscriptionError({
          message: `Invoice ${invoiceId} is not paid, only paid invoices can be prorated`,
        })
      )
    }

    // has to be paid in advance
    if (invoice.whenToBill !== "pay_in_advance") {
      return Err(
        new UnPriceSubscriptionError({
          message: `Invoice ${invoiceId} is not a pay in advance invoice`,
        })
      )
    }

    // the start date should be the same as the subscription cycle start date
    if (startAt !== invoice.cycleStartAt) {
      return Err(
        new UnPriceSubscriptionError({
          message: `Start date ${startAt} is not the same as the invoice cycle start date ${invoice.cycleStartAt}`,
        })
      )
    }

    // end date should be between the subscription cycle start and end date
    if (endAt < invoice.cycleStartAt || endAt > invoice.cycleEndAt) {
      return Err(
        new UnPriceSubscriptionError({
          message: `End date ${endAt} is not between the invoice cycle start date ${invoice.cycleStartAt} and end date ${invoice.cycleEndAt}`,
        })
      )
    }

    // calculate the prorated flat charges given these dates
    const invoiceProratedFlatItemsPrice = await this.calculateSubscriptionActivePhaseItemsPrice({
      cycleStartAt: startAt,
      cycleEndAt: endAt, // IMPORTANT: this is the end of the prorated period
      previousCycleStartAt: invoice.previousCycleStartAt,
      previousCycleEndAt: invoice.previousCycleEndAt,
      whenToBill: invoice.whenToBill,
      type: "flat", // we are prorating flat charges only
    })

    if (!invoice.invoiceId) {
      return Err(new UnPriceSubscriptionError({ message: "Invoice has no invoice id" }))
    }

    // check if the invoice is already paid in the payment provider
    if (invoice.status !== "paid" && invoice.status !== "void") {
      return Err(
        new UnPriceSubscriptionError({
          message: `Invoice ${invoiceId} is not paid, cannot prorate`,
        })
      )
    }

    const paymentProviderInvoice = await this.paymentProviderService.getInvoice({
      invoiceId: invoice.invoiceId,
    })

    if (paymentProviderInvoice.err) {
      return Err(
        new UnPriceSubscriptionError({
          message: `Error getting payment provider invoice: ${paymentProviderInvoice.err.message}`,
        })
      )
    }

    let amountRefund = 0

    // calculate the prorated flat charges
    // There must be a parity between flat items and item invoices.
    // This means that if we have an item in the prorated flat items price
    // we should have the same item in the payment provider invoice
    for (const item of paymentProviderInvoice.val?.items ?? []) {
      const { id, amount: amountPaid, productId, currency, metadata } = item

      // find the item in the invoice prorated flat items price
      // when we create the invoice we save metadata with the subscription item id
      const invoiceFlatItem = invoiceProratedFlatItemsPrice.val?.items.find(
        (i) =>
          // product id is the feature id (invoices are created for each feature)
          i.productId === productId ||
          // subscription item id is the feature id (invoices are created for each feature)
          i.metadata?.subscriptionItemId === metadata?.subscriptionItemId
      )

      if (!invoiceFlatItem) {
        return Err(
          new UnPriceSubscriptionError({
            message: `Invoice item ${id} not found in the prorated flat items price`,
          })
        )
      }

      // double check we are not prorating items that are not flat
      if (!["flat", "tier", "package"].includes(invoiceFlatItem.type)) {
        return Err(
          new UnPriceSubscriptionError({
            message: `Invoice item ${id} is not a flat charge, cannot prorate`,
          })
        )
      }

      // should be the same currency as the invoice
      if (invoice.currency !== currency.toUpperCase()) {
        return Err(
          new UnPriceSubscriptionError({
            message: `Invoice item ${id} has different currency as the invoice ${invoice.currency}`,
          })
        )
      }

      // depending on the payment provider, the amount is in different unit
      const formattedAmount = this.paymentProviderService.formatAmount(
        invoiceFlatItem.price.totalPrice.dinero
      )

      if (formattedAmount.err) {
        return Err(new UnPriceSubscriptionError({ message: "Error formatting amount" }))
      }

      // all of this to calculate how much to refund to the customer
      amountRefund += amountPaid - formattedAmount.val.amount
    }

    if (amountRefund > 0) {
      // create a credit for the customer
      const credit = await this.db
        .insert(customerCredits)
        .values({
          id: newId("customer_credit"),
          totalAmount: amountRefund,
          amountUsed: 0,
          customerId: customer.id,
          projectId: invoice.projectId,
          active: true,
          metadata: {
            note: `Refund for the prorated flat charges from ${startAt} to ${endAt} from invoice ${invoiceId}`,
          },
        })
        .returning()

      if (!credit) {
        return Err(new UnPriceSubscriptionError({ message: "Error creating credit" }))
      }
    }

    return Ok(undefined)
  }

  // TODO: add preview invoice so when we create the invoice we are sure it works
  // Finalizing an invoice only happens when the customer is ready to be invoiced and
  // this means we are going to create an invoice in the payment provider
  private async finalizeInvoice(payload: {
    invoice: SubscriptionInvoice
    now: number
  }): Promise<
    Result<
      {
        invoice: SubscriptionInvoice
      },
      UnPriceSubscriptionError
    >
  > {
    const { invoice, now } = payload

    // invoices can be finilize after due date only
    if (invoice.dueAt && invoice.dueAt > now) {
      return Err(
        new UnPriceSubscriptionError({ message: "Invoice is not due yet, cannot finalize" })
      )
    }

    // check if the invoice is already finalized
    if (invoice.status !== "draft") {
      return Ok({ invoice })
    }

    const {
      paymentProvider,
      currency,
      metadata,
      collectionMethod,
      cycleStartAt,
      cycleEndAt,
      projectId,
      invoiceId,
    } = invoice

    // pay_in_advance =  invoice flat charges for the current cycle + usage from the previous cycle if any
    // pay_in_arrear = invoice usage + flat charges for the current cycle
    // isCancel = true means the phase is being canceled, we need to invoice the current cycle differently
    // - pay_in_advance = the invoice was already paid or created, we need to calculate pro ratio for flat charges if any
    // + the usage charges from the current cycle
    // - pay_in_arrear = the invoice was not paid, we need to calculate the usage for the current cycle and add the flat charges pro rata

    const paymentProviderInvoiceData = {
      invoiceId: "",
      invoiceUrl: "",
      total: 0,
      subtotal: 0,
      amountCreditUsed: 0,
      customerCreditId: "",
      status: "unpaid" as InvoiceStatus,
    }

    const paymentValidation = await this.phaseMachine.validateCustomerPaymentMethod()
    const customer = this.phaseMachine.getCustomer()

    if (paymentValidation.err) {
      return Err(paymentValidation.err)
    }

    // when trying to finalize an invoice that has no payment method and
    // $0 we need to set the invoice status to void
    if (
      paymentValidation.val.requiredPaymentMethod === false &&
      paymentValidation.val.paymentMethodId === ""
    ) {
      // lets be sure the invoice has price 0
      const invoiceItemsPrice = await this.calculateSubscriptionActivePhaseItemsPrice({
        cycleStartAt: invoice.cycleStartAt,
        cycleEndAt: invoice.cycleEndAt,
        previousCycleStartAt: invoice.previousCycleStartAt,
        previousCycleEndAt: invoice.previousCycleEndAt,
        whenToBill: invoice.whenToBill,
        type: "hybrid",
      })

      if (invoiceItemsPrice.err) {
        return Err(invoiceItemsPrice.err)
      }

      // upsert the invoice items in the payment provider
      for (const item of invoiceItemsPrice.val.items) {
        // depending on the payment provider, the amount is in different unit
        // get the total amount of the invoice item given the quantity and proration
        const formattedTotalAmountItem = this.paymentProviderService.formatAmount(
          item.price.totalPrice.dinero
        )

        const formattedUnitAmountItem = this.paymentProviderService.formatAmount(
          item.price.unitPrice.dinero
        )

        if (formattedTotalAmountItem.err || formattedUnitAmountItem.err) {
          return Err(
            new UnPriceSubscriptionError({
              message: `Error formatting amount: ${
                formattedTotalAmountItem.err?.message ?? formattedUnitAmountItem.err?.message
              }`,
            })
          )
        }

        // sum up every item to calculate the subtotal of the invoice
        paymentProviderInvoiceData.subtotal += formattedUnitAmountItem.val.amount * item.quantity
      }

      paymentProviderInvoiceData.total = paymentProviderInvoiceData.subtotal
      paymentProviderInvoiceData.status = "void"

      if (paymentProviderInvoiceData.total > 0) {
        return Err(
          new UnPriceSubscriptionError({
            message: `Invoice has charges ${paymentProviderInvoiceData.total}, cannot set to void`,
          })
        )
      }

      // update credit and invoice in a transaction
      const result = await this.db.transaction(async (tx) => {
        try {
          // if all goes well, update the invoice with the payment provider invoice data
          const updatedInvoice = await tx
            .update(invoices)
            .set({
              invoiceId: "",
              invoiceUrl: "",
              subtotal: paymentProviderInvoiceData.subtotal,
              total: paymentProviderInvoiceData.total,
              status: paymentProviderInvoiceData.status,
              amountCreditUsed: 0,
              metadata: {
                note: `Invoice for subscription ${
                  this.phaseMachine.getSubscription().planSlug
                }, setting status to void`,
              },
            })
            .where(and(eq(invoices.id, invoice.id), eq(invoices.projectId, projectId)))
            .returning()
            .then((res) => res[0])

          if (!updatedInvoice) {
            return Err(new UnPriceSubscriptionError({ message: "Error finalizing invoice" }))
          }

          // if it's a test, we need to assign the invoice id and url from the invoice
          if (this.isTest) {
            Object.assign(updatedInvoice, {
              ...invoice,
              ...updatedInvoice,
            })
          }

          return Ok({ invoice: updatedInvoice })
        } catch (e) {
          const error = e as Error
          return Err(
            new UnPriceSubscriptionError({ message: `Error finalizing invoice: ${error.message}` })
          )
        }
      })

      return result
    }

    let invoiceData: PaymentProviderInvoice

    // if there is an invoice id, we get the invoice from the payment provider
    if (invoiceId) {
      const invoiceDataResult = await this.paymentProviderService.getInvoice({ invoiceId })

      if (invoiceDataResult.err) {
        return Err(new UnPriceSubscriptionError({ message: "Error getting invoice" }))
      }

      // this should not happen, but just in case
      if (invoiceDataResult.val.status === "paid" || invoiceDataResult.val.status === "void") {
        return Err(
          new UnPriceSubscriptionError({
            message: "Invoice is already paid or void, cannot finalize",
          })
        )
      }

      // could be possible the invoice is open and the customer cancel the phase
      // then we need to update the cycle dates
      // this can happen in the grace period for the subscription
      const updatedInvoice = await this.paymentProviderService.updateInvoice({
        invoiceId: invoiceDataResult.val.invoiceId,
        startCycle: cycleStartAt,
        endCycle: cycleEndAt,
        collectionMethod,
        description: metadata?.note ?? "",
        dueDate: invoice.pastDueAt,
      })

      if (updatedInvoice.err) {
        return Err(new UnPriceSubscriptionError({ message: "Error updating invoice" }))
      }

      invoiceData = updatedInvoice.val
    } else {
      // create a new invoice if there is no invoice id in the invoice
      const paymentProviderInvoice = await this.paymentProviderService.createInvoice({
        currency,
        customerName: customer.name,
        email: customer.email,
        startCycle: cycleStartAt,
        endCycle: cycleEndAt,
        collectionMethod,
        description: metadata?.note ?? "",
        dueDate: invoice.pastDueAt,
      })

      if (paymentProviderInvoice.err) {
        return Err(
          new UnPriceSubscriptionError({
            message: `Error creating ${paymentProvider} invoice: ${paymentProviderInvoice.err.message}`,
          })
        )
      }

      invoiceData = paymentProviderInvoice.val
    }

    // save the invoice id and url just in case the rest of the process fails
    await this.db
      .update(invoices)
      .set({
        invoiceId: invoiceData.invoiceId,
        invoiceUrl: invoiceData.invoiceUrl,
      })
      .where(and(eq(invoices.id, invoice.id), eq(invoices.projectId, projectId)))

    // calculate the price of the invoice items
    const invoiceItemsPrice = await this.calculateSubscriptionActivePhaseItemsPrice({
      cycleStartAt,
      cycleEndAt,
      previousCycleStartAt: invoice.previousCycleStartAt,
      previousCycleEndAt: invoice.previousCycleEndAt,
      whenToBill: invoice.whenToBill,
      type: invoice.type, // this is important because determines which items are being billed (flat, usage, or all - hybrid)
    })

    if (invoiceItemsPrice.err) {
      return Err(invoiceItemsPrice.err)
    }

    // upsert the invoice items in the payment provider
    for (const item of invoiceItemsPrice.val.items) {
      // depending on the payment provider, the amount is in different unit
      // get the total amount of the invoice item given the quantity and proration
      const formattedTotalAmountItem = this.paymentProviderService.formatAmount(
        item.price.totalPrice.dinero
      )

      const formattedUnitAmountItem = this.paymentProviderService.formatAmount(
        item.price.unitPrice.dinero
      )

      if (formattedTotalAmountItem.err || formattedUnitAmountItem.err) {
        return Err(
          new UnPriceSubscriptionError({
            message: `Error formatting amount: ${
              formattedTotalAmountItem.err?.message ?? formattedUnitAmountItem.err?.message
            }`,
          })
        )
      }

      // sum up every item to calculate the subtotal of the invoice
      paymentProviderInvoiceData.subtotal += formattedUnitAmountItem.val.amount * item.quantity

      // upsert the invoice item in the payment provider
      const invoiceItemExists = invoiceData.items.find(
        (i) =>
          i.productId === item.productId ||
          i.metadata?.subscriptionItemId === item.metadata?.subscriptionItemId
      )

      // invoice item already exists, we need to update the amount and quantity
      if (invoiceItemExists) {
        const updateItemInvoice = await this.paymentProviderService.updateInvoiceItem({
          invoiceItemId: invoiceItemExists.id,
          totalAmount: formattedTotalAmountItem.val.amount,
          quantity: item.quantity,
          name: item.productSlug,
          isProrated: item.prorate !== 1,
          metadata: item.metadata,
        })

        if (updateItemInvoice.err) {
          return Err(
            new UnPriceSubscriptionError({
              message: `Error updating invoice item: ${updateItemInvoice.err.message}`,
            })
          )
        }
      } else {
        const itemInvoice = await this.paymentProviderService.addInvoiceItem({
          invoiceId: invoiceData.invoiceId,
          name: item.productSlug,
          // TODO: uncomment when ready
          // for testing we don't send the product id so we can create the
          // invoice item without having to create the product in the payment provider
          ...(this.isTest ? {} : { productId: item.productId }),
          // productId: item.productId.startsWith("feature-") ? undefined : item.productId,
          isProrated: item.prorate !== 1,
          totalAmount: formattedTotalAmountItem.val.amount,
          unitAmount: formattedUnitAmountItem.val.amount,
          description: item.description,
          quantity: item.quantity,
          currency: invoice.currency,
          metadata: item.metadata,
        })

        if (itemInvoice.err) {
          return Err(
            new UnPriceSubscriptionError({
              message: `Error adding invoice item: ${itemInvoice.err.message}`,
            })
          )
        }
      }
    }

    // update the invoice data
    paymentProviderInvoiceData.invoiceId = invoiceData.invoiceId
    paymentProviderInvoiceData.invoiceUrl = invoiceData.invoiceUrl

    // get the credits for the customer if any
    // for now we only allow one active credit per customer
    const credits = await this.db.query.customerCredits
      .findMany({
        where: (table, { eq, and }) =>
          and(eq(table.customerId, customer.id), eq(table.active, true)),
      })
      .then((res) => res[0])

    // the amount of the credit used to pay the invoice
    let amountCreditUsed = 0
    const customerCreditId = credits?.id

    // if there is a credit and the remaining amount is greater than the invoice subtotal,
    // we discount the substotal from the credit
    // if not we apply the entire credit to the invoice
    // either case we need to update the credit with the amount used
    // and create a negative charge for the invoice in the payment provider
    if (customerCreditId) {
      // set the customer credit id to the invoice
      paymentProviderInvoiceData.customerCreditId = customerCreditId

      const remainingCredit = credits.totalAmount - credits.amountUsed

      // set the total amount of the credit
      if (remainingCredit >= paymentProviderInvoiceData.subtotal) {
        amountCreditUsed = paymentProviderInvoiceData.subtotal
      } else {
        amountCreditUsed = remainingCredit
      }

      if (amountCreditUsed > 0) {
        // we need to check if the invoice item already exists (credit charge)
        const creditChargeExists = invoiceData.items.find(
          (i) => i.metadata?.creditId === customerCreditId
        )

        if (creditChargeExists) {
          const creditCharge = await this.paymentProviderService.updateInvoiceItem({
            invoiceItemId: creditChargeExists.id,
            totalAmount: -amountCreditUsed,
            name: "Credit",
            description: "Credit applied to the invoice",
            isProrated: false,
            quantity: 1,
            metadata: {
              creditId: customerCreditId,
            },
          })

          if (creditCharge.err) {
            return Err(
              new UnPriceSubscriptionError({
                message: `Error updating credit charge: ${creditCharge.err.message}`,
              })
            )
          }
        } else {
          const creditCharge = await this.paymentProviderService.addInvoiceItem({
            invoiceId: invoiceData.invoiceId,
            name: "Credit",
            description: "Credit applied to the invoice",
            isProrated: false,
            totalAmount: -amountCreditUsed,
            quantity: 1,
            currency: invoice.currency,
            metadata: {
              creditId: customerCreditId,
            },
          })

          if (creditCharge.err) {
            return Err(
              new UnPriceSubscriptionError({
                message: `Error adding credit charge: ${creditCharge.err.message}`,
              })
            )
          }
        }
      }
    }

    // total amount of the invoice after the credit is applied
    paymentProviderInvoiceData.total = paymentProviderInvoiceData.subtotal - amountCreditUsed

    // if total is 0, we need to set the invoice status to void
    if (paymentProviderInvoiceData.total === 0) {
      paymentProviderInvoiceData.status = "void"
    } else {
      paymentProviderInvoiceData.status = "unpaid"
    }

    // update credit and invoice in a transaction
    const result = await this.db.transaction(async (tx) => {
      try {
        if (customerCreditId) {
          const amountUsed = credits.amountUsed + amountCreditUsed

          // if the whole credit is used, we need to set the credit to inactive
          const status = !(amountUsed >= credits.totalAmount)
          await tx
            .update(customerCredits)
            .set({
              amountUsed,
              active: status,
            })
            .where(
              and(
                eq(customerCredits.id, customerCreditId),
                eq(customerCredits.projectId, projectId)
              )
            )
            .catch((e) => {
              tx.rollback()
              throw e
            })
        }

        // if all goes well, update the invoice with the payment provider invoice data
        const updatedInvoice = await tx
          .update(invoices)
          .set({
            invoiceId: paymentProviderInvoiceData.invoiceId,
            invoiceUrl: paymentProviderInvoiceData.invoiceUrl,
            subtotal: paymentProviderInvoiceData.subtotal,
            total: paymentProviderInvoiceData.total,
            status: paymentProviderInvoiceData.status,
            amountCreditUsed,
            // set the customer credit id if it exists
            ...(paymentProviderInvoiceData.customerCreditId !== "" && {
              customerCreditId: paymentProviderInvoiceData.customerCreditId,
            }),
          })
          .where(and(eq(invoices.id, invoice.id), eq(invoices.projectId, projectId)))
          .returning()
          .then((res) => res[0])

        if (!updatedInvoice) {
          return Err(new UnPriceSubscriptionError({ message: "Error finalizing invoice" }))
        }

        // if it's a test, we need to assign the invoice id and url from the invoice
        if (this.isTest) {
          Object.assign(updatedInvoice, {
            ...invoice,
            ...updatedInvoice,
          })
        }

        return Ok({ invoice: updatedInvoice })
      } catch (e) {
        const error = e as Error
        return Err(
          new UnPriceSubscriptionError({ message: `Error finalizing invoice: ${error.message}` })
        )
      }
    })

    return result
  }

  private async collectInvoicePayment(payload: {
    invoice: SubscriptionInvoice
    autoFinalize?: boolean
    now: number
  }): Promise<
    Result<
      {
        status: InvoiceStatus
        retries: number
        pastDueAt: number | undefined
        total: number
        invoiceId: string
        paymentInvoiceId?: string
      },
      UnPriceSubscriptionError
    >
  > {
    const { invoice, now, autoFinalize = false } = payload

    let invoiceData = invoice

    // invoices need to be finalized before collecting the payment
    // finalizing the invoice will create the invoice in the payment provider
    // the invoice by default is created in our system as draft so we can apply changes to it
    // before sending it to the payment provider
    if (autoFinalize) {
      const result = await this.finalizeInvoice({
        invoice,
        now,
      })

      if (result.err) {
        return Err(result.err)
      }

      invoiceData = result.val.invoice
    }

    let result: InvoiceStatus = "waiting"

    // TODO: how to handle multiple invoices?
    const { collectionMethod, invoiceId, status, paymentAttempts, pastDueAt, dueAt } = invoiceData

    // check if the invoice is due
    if (dueAt && dueAt > now) {
      return Err(new UnPriceSubscriptionError({ message: "Invoice is not due yet" }))
    }

    // check if the invoice is already paid
    if (["paid", "void"].includes(status)) {
      return Ok({
        status: status,
        retries: paymentAttempts?.length ?? 0,
        pastDueAt,
        total: invoiceData.total,
        invoiceId: invoice.id,
        paymentInvoiceId: invoiceData.invoiceId ?? undefined,
      })
    }

    // if the invoice is draft, we can't collect the payment
    if (status === "draft") {
      return Err(
        new UnPriceSubscriptionError({ message: "Invoice is draft, cannot collect payment" })
      )
    }

    // by this point the invoice is closed and it should have an invoice id from the payment provider
    if (!invoiceId) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Invoice is closed, but has no invoice id from the payment provider",
        })
      )
    }

    // TODO: does it makes sense to collect payment from invoices with total 0?

    // validate if the invoice is failed
    if (status === "failed") {
      // meaning the invoice is past due and we cannot collect the payment with 3 attempts
      return Ok({
        status: "failed",
        retries: paymentAttempts?.length ?? 0,
        pastDueAt,
        total: invoiceData.total,
        invoiceId: invoice.id,
        paymentInvoiceId: invoiceData.invoiceId ?? undefined,
      })
    }

    // if the invoice is waiting, we need to check if the payment is successful
    // waiting mean we sent the invoice to the customer and we are waiting for the payment (manual payment)
    if (status === "waiting") {
      // check the status of the payment in the provider
      const statusInvoice = await this.paymentProviderService.getStatusInvoice({
        invoiceId: invoiceId,
      })

      if (statusInvoice.err) {
        return Err(new UnPriceSubscriptionError({ message: "Error getting invoice status" }))
      }

      // if the invoice is paid or void, we update the invoice status
      if (statusInvoice.val.status === "paid" || statusInvoice.val.status === "void") {
        // update the invoice status
        const updatedInvoice = await this.db
          .update(invoices)
          .set({
            status: statusInvoice.val.status,
            paidAt: statusInvoice.val.paidAt,
            invoiceUrl: statusInvoice.val.invoiceUrl,
            paymentAttempts: [...(paymentAttempts ?? []), ...statusInvoice.val.paymentAttempts],
          })
          .where(eq(invoices.id, invoice.id))
          .returning()
          .then((res) => res[0])

        if (!updatedInvoice) {
          return Err(new UnPriceSubscriptionError({ message: "Error updating invoice" }))
        }

        // update the subscription dates
        await this.phaseMachine.transition("REPORT_PAYMENT", {
          now,
          invoiceId: invoice.id,
        })

        return Ok({
          status: statusInvoice.val.status,
          retries: updatedInvoice.paymentAttempts?.length ?? 0,
          pastDueAt,
          total: invoiceData.total,
          invoiceId: invoice.id,
          paymentInvoiceId: invoiceData.invoiceId ?? undefined,
        })
      }

      // the past due date is past then we need to update the subscription to past_due
      if (pastDueAt > now) {
        // mark the invoice as failed
        await this.db
          .update(invoices)
          .set({
            status: "failed",
            metadata: { note: "Invoice exceeded the payment due date" },
          })
          .where(eq(invoices.id, invoice.id))

        await this.phaseMachine.transition("PAST_DUE", {
          now,
          pastDueAt,
          metadataPhase: {
            pastDue: {
              reason: "payment_pending",
              note: "Invoice exceeded the payment due date",
              invoiceId: invoice.id,
            },
          },
          metadataSubscription: {
            reason: "payment_pending",
            note: "Invoice exceeded the payment due date",
          },
        })

        return Ok({
          status: "failed",
          retries: paymentAttempts?.length ?? 0,
          pastDueAt,
          total: invoiceData.total,
          invoiceId: invoice.id,
          paymentInvoiceId: invoiceData.invoiceId ?? undefined,
        })
      }

      // if the invoice is not paid yet, we keep waiting for the payment
      return Ok({
        status: "waiting",
        retries: paymentAttempts?.length ?? 0,
        pastDueAt,
        total: invoiceData.total,
        invoiceId: invoice.id,
        paymentInvoiceId: invoiceData.invoiceId ?? undefined,
      })
    }

    // 3 attempts max for the invoice
    if (paymentAttempts?.length && paymentAttempts.length >= 3) {
      // update the invoice status
      await this.db
        .update(invoices)
        .set({
          status: "failed",
          metadata: { note: "Invoice has reached the maximum number of payment attempts" },
        })
        .where(eq(invoices.id, invoice.id))

      await this.phaseMachine.transition("PAST_DUE", {
        now,
        pastDueAt,
        metadataPhase: {
          pastDue: {
            reason: "payment_failed",
            note: "Invoice has reached the maximum number of payment attempts",
            invoiceId: invoice.id,
          },
        },
        metadataSubscription: {
          reason: "payment_failed",
          note: "Invoice has reached the maximum number of payment attempts",
        },
      })

      return Err(
        new UnPriceSubscriptionError({
          message: "Invoice has reached the maximum number of payment attempts",
        })
      )
    }

    // at this point the invoice is not paid yet and we are not waiting for the payment
    const defaultPaymentMethodId = await this.paymentProviderService.getDefaultPaymentMethodId()

    if (defaultPaymentMethodId.err) {
      return Err(
        new UnPriceSubscriptionError({
          message: `Error getting default payment method: ${defaultPaymentMethodId.err.message}`,
        })
      )
    }

    // collect the payment depending on the collection method
    // collect automatically means we will try to collect the payment with the default payment method
    if (collectionMethod === "charge_automatically") {
      const stripePaymentInvoice = await this.paymentProviderService.collectPayment({
        invoiceId: invoiceId,
        paymentMethodId: defaultPaymentMethodId.val.paymentMethodId,
      })

      if (stripePaymentInvoice.err) {
        // update the attempt if the payment failed
        await this.db
          .update(invoices)
          .set({
            // set the intempts to failed
            paymentAttempts: [
              ...(paymentAttempts ?? []),
              { status: "failed", createdAt: Date.now() },
            ],
          })
          .where(eq(invoices.id, invoice.id))

        return Err(
          new UnPriceSubscriptionError({
            message: `Error collecting payment: ${stripePaymentInvoice.err.message}`,
          })
        )
      }

      const paymentStatus = stripePaymentInvoice.val.status

      // update the invoice status if the payment is successful
      // if not add the failed attempt
      await this.db
        .update(invoices)
        .set({
          status: ["paid", "void"].includes(paymentStatus) ? "paid" : "unpaid",
          ...(["paid", "void"].includes(paymentStatus) ? { paidAt: Date.now() } : {}),
          paymentAttempts: [
            ...(paymentAttempts ?? []),
            {
              status: ["paid", "void"].includes(paymentStatus) ? "paid" : "failed",
              createdAt: Date.now(),
            },
          ],
        })
        .where(eq(invoices.id, invoice.id))

      // update the subscription dates if the payment is successful
      if (paymentStatus === "paid" || paymentStatus === "void") {
        await this.phaseMachine.transition("REPORT_PAYMENT", {
          now,
          invoiceId: invoice.id,
        })

        result = "paid"
      } else {
        result = "unpaid"
      }
    } else if (collectionMethod === "send_invoice") {
      const stripeSendInvoice = await this.paymentProviderService.sendInvoice({
        invoiceId: invoiceId,
      })

      if (stripeSendInvoice.err) {
        return Err(
          new UnPriceSubscriptionError({
            message: `Error sending invoice: ${stripeSendInvoice.err.message}`,
          })
        )
      }

      // update the invoice status if send invoice is successful
      await this.db
        .update(invoices)
        .set({
          status: "waiting",
          sentAt: Date.now(),
          metadata: {
            ...(invoice.metadata ?? {}),
            note: "Invoice sent to the customer, waiting for payment",
          },
        })
        .where(eq(invoices.id, invoice.id))

      result = "waiting"
    }

    return Ok({
      status: result,
      retries: paymentAttempts?.length ?? 0,
      pastDueAt,
      total: invoiceData.total,
      invoiceId: invoiceData.id,
      paymentInvoiceId: invoiceData.invoiceId ?? undefined,
    })
  }

  private async calculateSubscriptionActivePhaseItemsPrice(payload: {
    cycleStartAt: number
    cycleEndAt: number
    previousCycleStartAt: number | null
    previousCycleEndAt: number | null
    whenToBill: WhenToBill
    type: InvoiceType
  }): Promise<
    Result<
      {
        items: {
          featureType: FeatureType
          productId: string
          price: CalculatedPrice
          quantity: number
          prorate: number
          productSlug: string
          type: FeatureType
          description?: string
          metadata: {
            subscriptionItemId: string
          }
        }[]
      },
      UnPriceSubscriptionError
    >
  > {
    const phase = this.phaseMachine.getPhase()
    const subscription = this.phaseMachine.getSubscription()
    const customer = this.phaseMachine.getCustomer()

    if (!phase) {
      return Err(new UnPriceSubscriptionError({ message: "No active phase with the given id" }))
    }

    const { cycleStartAt, cycleEndAt, previousCycleStartAt, previousCycleEndAt, whenToBill, type } =
      payload

    // when billing in advance we calculate flat price for the current cycle + usage from the past cycles
    // when billing in arrear we calculate usage for the current cycle + flat price current cycle
    const shouldBillInAdvance = whenToBill === "pay_in_advance"

    // TODO: do I need to calculate the cycle here again?
    // calculate proration for the current billing cycle
    // will return the proration factor given the start and end of the cycle
    const calculatedCurrentBillingCycle = configureBillingCycleSubscription({
      currentCycleStartAt: cycleStartAt,
      billingCycleStart: phase.startCycle,
      billingPeriod: phase.planVersion.billingPeriod,
      endAt: cycleEndAt,
    })

    const proration = calculatedCurrentBillingCycle.prorationFactor
    const invoiceItems = []

    const billableItems =
      type === "hybrid"
        ? phase.items
        : type === "flat"
          ? // flat charges are those when the quantity is defined in the subscription item
            phase.items.filter((item) =>
              ["flat", "tier", "package"].includes(item.featurePlanVersion.featureType)
            )
          : phase.items.filter((item) => item.featurePlanVersion.featureType === "usage")

    // we bill the subscriptions items attached to the phase, that way if the customer changes the plan,
    // we create a new phase and bill the new plan and there are no double charges for the same feature in past cycles
    // also this give us the flexibility to add new features to the plan without affecting the past invoices
    // we called that custom entitlements (outside of the subscription)

    try {
      // create a item for each feature
      for (const item of billableItems) {
        let prorate = proration

        // proration is supported for fixed cost items - not for usage
        if (item.featurePlanVersion.featureType === "usage") {
          prorate = 1 // bill usage as full price
        }

        // calculate the quantity of the feature
        let quantity = 0

        // get the usage depending on the billing type
        // when billing at the end of the cycle we get the usage for the current cycle + fixed price from current cycle
        if (!shouldBillInAdvance) {
          // get usage only for usage features - the rest are calculated from the subscription items
          if (["flat", "tier", "package"].includes(item.featurePlanVersion.featureType)) {
            quantity = item.units! // all non usage features have a quantity the customer bought in the subscription
          } else {
            const usage = await this.analytics
              .getTotalUsagePerFeature({
                featureSlug: item.featurePlanVersion.feature.slug,
                subscriptionItemId: item.id,
                projectId: subscription.projectId,
                customerId: customer.id,
                // get usage for the current cycle
                start: cycleStartAt,
                end: cycleEndAt,
              })
              .then((usage) => {
                return usage.data[0]
              })

            const units = usage ? usage[item.featurePlanVersion.aggregationMethod] || 0 : 0

            // the amount of units the customer used in the current cycle
            quantity = units
          }
        } else {
          // get usage only for usage features - the rest are calculated from the subscription items
          if (["flat", "tier", "package"].includes(item.featurePlanVersion.featureType)) {
            quantity = item.units! // all non usage features have a quantity the customer bought in the subscription
          } else {
            // For billing in advance we need to get the usage for the previous cycle if any
            // this way we combine one single invoice for the cycle
            if (previousCycleStartAt && previousCycleEndAt) {
              // get usage for the current cycle
              const usage = await this.analytics
                .getTotalUsagePerFeature({
                  featureSlug: item.featurePlanVersion.feature.slug,
                  projectId: subscription.projectId,
                  subscriptionItemId: item.id,
                  customerId: customer.id,
                  start: previousCycleStartAt,
                  end: previousCycleEndAt,
                })
                .then((usage) => usage.data[0])

              const units = usage ? usage[item.featurePlanVersion.aggregationMethod] || 0 : 0

              // the amount of units the customer used in the previous cycle
              quantity = units
            }
          }
        }

        // this should never happen but we add a check anyway just in case
        if (quantity < 0) {
          // throw and cancel execution
          throw new Error(
            `quantity is negative ${item.id} ${item.featurePlanVersion.feature.slug} ${quantity}`
          )
        }

        // calculate the price depending on the type of feature
        const priceCalculation = calculatePricePerFeature({
          feature: item.featurePlanVersion,
          quantity: quantity,
          prorate: prorate,
        })

        if (priceCalculation.err) {
          throw new Error(
            `Error calculating price for ${item.featurePlanVersion.feature.slug} ${JSON.stringify(
              priceCalculation.err
            )}`
          )
        }

        // give good description per item type so the customer can identify the charge
        // take into account if the charge is prorated or not
        // add the period of the charge if prorated
        let description = undefined

        if (item.featurePlanVersion.featureType === "usage") {
          description = `${item.featurePlanVersion.feature.title.toUpperCase()} - usage`
        } else if (item.featurePlanVersion.featureType === "flat") {
          description = `${item.featurePlanVersion.feature.title.toUpperCase()} - flat`
        } else if (item.featurePlanVersion.featureType === "tier") {
          description = `${item.featurePlanVersion.feature.title.toUpperCase()} - tier`
        } else if (item.featurePlanVersion.featureType === "package") {
          // package is a special case, we need to calculate the quantity of packages the customer bought
          // we do it after the price calculation because we pass the package units to the payment provider
          const quantityPackages = Math.ceil(quantity / item.featurePlanVersion.config?.units!)
          quantity = quantityPackages
          description = `${item.featurePlanVersion.feature.title.toUpperCase()} - ${quantityPackages} package of ${item
            .featurePlanVersion.config?.units!} units`
        }

        if (prorate !== 1) {
          const startDate = new Date(Number(calculatedCurrentBillingCycle.cycleStart))
          const endDate = new Date(Number(calculatedCurrentBillingCycle.cycleEnd))
          const billingPeriod = `${startDate.toLocaleString("default", {
            month: "short",
          })} ${startDate.getDate()} - ${endDate.toLocaleString("default", {
            month: "short",
          })} ${endDate.getDate()}`

          description += ` prorated (${billingPeriod})`
        }

        // create an invoice item for each feature
        invoiceItems.push({
          featureType: item.featurePlanVersion.featureType,
          quantity,
          productId: item.featurePlanVersion.feature.id,
          price: priceCalculation.val,
          productSlug: item.featurePlanVersion.feature.slug,
          prorate: prorate,
          type: item.featurePlanVersion.featureType,
          description: description,
          metadata: {
            subscriptionItemId: item.id,
          },
        })

        // order invoice items by feature type
        invoiceItems.sort((a, b) => a.featureType.localeCompare(b.featureType))
      }

      return Ok({
        items: invoiceItems,
      })
    } catch (e) {
      const error = e as Error
      return Err(new UnPriceSubscriptionError({ message: `Unhandled error: ${error.message}` }))
    }
  }
}
