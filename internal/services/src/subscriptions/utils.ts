import { and, eq } from "@unprice/db"
import { invoices } from "@unprice/db/schema"
import { AesGCM } from "@unprice/db/utils"
import {
  type BillingConfig,
  type CalculatedPrice,
  type Customer,
  type FeatureType,
  type InvoiceStatus,
  type PaymentProvider,
  type SubscriptionInvoice,
  type SubscriptionItemExtended,
  calculatePricePerFeature,
} from "@unprice/db/validators"
import { Err, Ok, type Result } from "@unprice/error"
import type { Logger } from "@unprice/logging"
import type { Analytics } from "@unprice/tinybird"
import { env } from "../../env"
import { PaymentProviderService } from "../payment-provider"
import { db } from "../utils/db"
import { UnPriceSubscriptionError } from "./errors"

interface ValidatePaymentMethodResult {
  paymentMethodId: string | null
  requiredPaymentMethod: boolean
}

/**
 * Validates the payment method status for a customer
 * @param customer - Customer information
 * @param paymentProvider - Optional payment provider
 * @param requiredPaymentMethod - Whether payment method is required
 * @param logger - Logger instance
 * @returns Payment method validation result
 */
export async function validatePaymentMethod({
  customer,
  paymentProvider,
  requiredPaymentMethod = false,
  logger,
}: {
  customer: Customer
  paymentProvider?: PaymentProvider
  requiredPaymentMethod?: boolean
  logger: Logger
}): Promise<ValidatePaymentMethodResult> {
  // If payment method is not required or no provider, return early
  if (!requiredPaymentMethod || !paymentProvider) {
    return {
      paymentMethodId: null,
      requiredPaymentMethod: false,
    }
  }

  // Get active payment provider config
  const config = await db.query.paymentProviderConfig.findFirst({
    where: (config, { and, eq }) =>
      and(
        eq(config.projectId, customer.projectId),
        eq(config.paymentProvider, paymentProvider),
        eq(config.active, true)
      ),
  })

  if (!config) {
    throw new Error("Payment provider config not found or not active")
  }

  // Decrypt provider key
  const aesGCM = await AesGCM.withBase64Key(env.ENCRYPTION_KEY)
  const decryptedKey = await aesGCM.decrypt({
    iv: config.keyIv,
    ciphertext: config.key,
  })

  // Initialize payment provider service
  const paymentProviderService = new PaymentProviderService({
    customer,
    paymentProvider,
    logger,
    token: decryptedKey,
  })

  const { err: paymentMethodErr, val: paymentMethodId } =
    await paymentProviderService.getDefaultPaymentMethodId()

  if (paymentMethodErr) {
    throw new Error(`Payment validation failed: ${paymentMethodErr.message}`)
  }

  if (requiredPaymentMethod && !paymentMethodId?.paymentMethodId) {
    throw new Error("Required payment method not found")
  }

  return {
    paymentMethodId: paymentMethodId.paymentMethodId,
    requiredPaymentMethod: true,
  }
}

interface FinalizeInvoiceResult {
  invoice: SubscriptionInvoice
}

/**
 * Finalizes an invoice by calculating prices and updating its status
 * @param payload - Invoice finalization parameters
 * @returns Finalized invoice result
 */
export async function finalizeInvoice(payload: {
  invoiceId: string
  projectId: string
  logger: Logger
  now: number
  analytics: Analytics
}): Promise<Result<FinalizeInvoiceResult, UnPriceSubscriptionError>> {
  const { invoiceId, projectId, logger, now, analytics } = payload

  // Get invoice details
  const invoice = await db.query.invoices.findFirst({
    where: (table, { eq, and }) => and(eq(table.id, invoiceId), eq(table.projectId, projectId)),
  })

  if (!invoice) {
    return Err(new UnPriceSubscriptionError({ message: "Invoice not found" }))
  }

  // Check if invoice can be finalized
  if (invoice.dueAt && invoice.dueAt > now) {
    return Err(
      new UnPriceSubscriptionError({
        message: "Invoice is not due yet, cannot finalize",
      })
    )
  }

  // Return early if invoice is already finalized
  if (!["draft"].includes(invoice.status)) {
    return Ok({ invoice })
  }

  const { paymentProvider, subscriptionId } = invoice

  // Get subscription data with related entities
  const subscriptionData = await db.query.subscriptions.findFirst({
    where: (table, { eq, and }) =>
      and(eq(table.id, subscriptionId), eq(table.projectId, projectId)),
    with: {
      customer: true,
      phases: {
        where(fields, operators) {
          return operators.and(
            operators.eq(fields.id, invoice.subscriptionPhaseId),
            operators.eq(fields.projectId, projectId)
          )
        },
        with: {
          planVersion: true,
          items: {
            with: {
              featurePlanVersion: {
                with: {
                  feature: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!subscriptionData) {
    return Err(new UnPriceSubscriptionError({ message: "Subscription not found" }))
  }

  const { phases, customer } = subscriptionData
  const phase = phases[0]

  if (!phase) {
    return Err(
      new UnPriceSubscriptionError({
        message: `Subscription phase ${invoice.subscriptionPhaseId} not found`,
      })
    )
  }

  // Get payment provider config
  const config = await db.query.paymentProviderConfig.findFirst({
    where: (config, { and, eq }) =>
      and(
        eq(config.projectId, customer.projectId),
        eq(config.paymentProvider, paymentProvider),
        eq(config.active, true)
      ),
  })

  if (!config) {
    return Err(
      new UnPriceSubscriptionError({
        message: "Payment provider config not found or not active",
      })
    )
  }

  // Initialize payment provider
  const aesGCM = await AesGCM.withBase64Key(env.ENCRYPTION_KEY)
  const decryptedKey = await aesGCM.decrypt({
    iv: config.keyIv,
    ciphertext: config.key,
  })

  const paymentProviderService = new PaymentProviderService({
    customer,
    paymentProvider,
    logger,
    token: decryptedKey,
  })

  // Initialize invoice data
  const paymentProviderInvoiceData = {
    invoiceId: "",
    invoiceUrl: "",
    total: 0,
    subtotal: 0,
    amountCreditUsed: 0,
    customerCreditId: "",
    status: "unpaid" as InvoiceStatus,
  }

  // Calculate invoice items prices for the current phase
  const invoiceItemsPrice = await calculateInvoiceItemsPrice({
    invoice,
    items: phase.items,
    billingConfig: phase.planVersion.billingConfig,
    analytics,
    customer,
  })

  if (invoiceItemsPrice.err) {
    return Err(invoiceItemsPrice.err)
  }

  // Calculate invoice totals
  for (const item of invoiceItemsPrice.val.items) {
    const formattedTotalAmount = paymentProviderService.formatAmount(item.price.totalPrice.dinero)
    const formattedUnitAmount = paymentProviderService.formatAmount(item.price.unitPrice.dinero)

    if (formattedTotalAmount.err || formattedUnitAmount.err) {
      return Err(
        new UnPriceSubscriptionError({
          message: `Error formatting amount: ${
            formattedTotalAmount.err?.message ?? formattedUnitAmount.err?.message
          }`,
        })
      )
    }

    paymentProviderInvoiceData.subtotal += formattedUnitAmount.val.amount * item.quantity
  }

  // Handle zero-amount invoices without payment method no need to create an invoice in the payment provider
  const isZeroAmountInvoice = paymentProviderInvoiceData.subtotal === 0
  const noPaymentMethod =
    invoice.requiredPaymentMethod === false &&
    (!invoice.paymentMethodId || invoice.paymentMethodId === "")

  if (isZeroAmountInvoice || noPaymentMethod) {
    paymentProviderInvoiceData.status = "void"

    // Update invoice in database
    return await db.transaction(async (tx) => {
      try {
        const updatedInvoice = await tx
          .update(invoices)
          .set({
            invoicePaymentProviderId: "",
            invoicePaymentProviderUrl: "",
            subtotal: paymentProviderInvoiceData.subtotal,
            total: paymentProviderInvoiceData.total,
            status: paymentProviderInvoiceData.status,
            amountCreditUsed: 0,
            metadata: {
              ...(invoice.metadata?.note && { note: invoice.metadata.note }),
              reason: "invoice_voided",
              note: `Invoice for subscription ${subscriptionData.planSlug}, setting status to void`,
            },
          })
          .where(and(eq(invoices.id, invoice.id), eq(invoices.projectId, projectId)))
          .returning()
          .then((res) => res[0])

        if (!updatedInvoice) {
          return Err(new UnPriceSubscriptionError({ message: "Error finalizing invoice" }))
        }

        return Ok({ invoice: updatedInvoice })
      } catch (e) {
        const error = e as Error
        return Err(
          new UnPriceSubscriptionError({
            message: `Error finalizing invoice: ${error.message}`,
          })
        )
      }
    })
  }

  // Handle invoice creation/update in payment provider with amount > 0
  if (!invoice.paymentMethodId) {
    return Err(
      new UnPriceSubscriptionError({
        message: "Invoice requires a payment method, please set a payment method first",
      })
    )
  }

  // create the invoice in the payment provider
  // Calculate final invoice totals
  paymentProviderInvoiceData.status = "unpaid"

  // Create new invoice
  const paymentProviderInvoice = await paymentProviderService.createInvoice({
    currency: invoice.currency,
    customerName: customer.name,
    email: customer.email,
    collectionMethod: invoice.collectionMethod,
    description: invoice.metadata?.note ?? "",
    dueDate: invoice.pastDueAt,
    customFields: [
      {
        name: "Billing Period",
        value: `${new Date(invoice.cycleStartAt).toISOString().split("T")[0]} to ${
          new Date(invoice.cycleEndAt).toISOString().split("T")[0]
        }`,
      },
    ],
  })

  if (paymentProviderInvoice.err) {
    return Err(
      new UnPriceSubscriptionError({
        message: `Error creating ${paymentProvider} invoice: ${paymentProviderInvoice.err.message}`,
      })
    )
  }

  // create invoice items
  // upsert the invoice items in the payment provider
  for (const item of invoiceItemsPrice.val.items) {
    // depending on the payment provider, the amount is in different unit
    // get the total amount of the invoice item given the quantity and proration
    const formattedTotalAmountItem = paymentProviderService.formatAmount(
      item.price.totalPrice.dinero
    )

    const formattedUnitAmountItem = paymentProviderService.formatAmount(item.price.unitPrice.dinero)

    if (formattedTotalAmountItem.err || formattedUnitAmountItem.err) {
      return Err(
        new UnPriceSubscriptionError({
          message: `Error formatting amount: ${
            formattedTotalAmountItem.err?.message ?? formattedUnitAmountItem.err?.message
          }`,
        })
      )
    }

    const itemInvoice = await paymentProviderService.addInvoiceItem({
      invoiceId: paymentProviderInvoice.val.invoiceId,
      name: item.productSlug,
      // TODO: uncomment when ready
      // for testing we don't send the product id so we can create the
      // invoice item without having to create the product in the payment provider
      // ...(this.isTest ? {} : { productId: item.productId }),
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

  // this will change when supporting proration
  paymentProviderInvoiceData.total = paymentProviderInvoiceData.subtotal

  // Update final invoice state
  return await db.transaction(async (tx) => {
    try {
      const updatedInvoice = await tx
        .update(invoices)
        .set({
          invoicePaymentProviderId: paymentProviderInvoice.val.invoiceId,
          invoicePaymentProviderUrl: paymentProviderInvoice.val.invoiceUrl,
          subtotal: paymentProviderInvoiceData.subtotal,
          total: paymentProviderInvoiceData.total,
          status: paymentProviderInvoiceData.status,
          amountCreditUsed: 0,
          ...(paymentProviderInvoiceData.customerCreditId && {
            customerCreditId: paymentProviderInvoiceData.customerCreditId,
          }),
        })
        .where(and(eq(invoices.id, invoice.id), eq(invoices.projectId, projectId)))
        .returning()
        .then((res) => res[0])

      if (!updatedInvoice) {
        return Err(new UnPriceSubscriptionError({ message: "Error finalizing invoice" }))
      }

      return Ok({ invoice: updatedInvoice })
    } catch (e) {
      const error = e as Error
      return Err(
        new UnPriceSubscriptionError({
          message: `Error finalizing invoice: ${error.message}`,
        })
      )
    }
  })
}

const calculateInvoiceItemsPrice = async (payload: {
  invoice: SubscriptionInvoice
  items: SubscriptionItemExtended[]
  billingConfig: BillingConfig
  analytics: Analytics
  customer: Customer
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
> => {
  const { invoice, items, analytics, customer } = payload

  // when billing in advance we calculate flat price for the current cycle + usage from the past cycles
  // when billing in arrear we calculate usage for the current cycle + flat price current cycle
  const shouldBillInAdvance = invoice.whenToBill === "pay_in_advance"
  const proration = 1 // for now we assumte the whole cycle is billed
  const invoiceItems = []

  // depending on the invoice type we filter the items to bill
  const billableItems =
    invoice.type === "hybrid"
      ? items
      : invoice.type === "flat"
        ? // flat charges are those when the quantity is defined in the subscription item
          items.filter((item) =>
            ["flat", "tier", "package"].includes(item.featurePlanVersion.featureType)
          )
        : items.filter((item) => item.featurePlanVersion.featureType === "usage")

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
          // if the aggregation method is _all we get the usage for all time
          const usage = item.featurePlanVersion.aggregationMethod.endsWith("_all")
            ? await analytics
                .getBillingUsage({
                  subscriptionItemId: item.id,
                  projectId: item.projectId,
                  customerId: customer.id,
                })
                .then((usage) => usage.data[0])
            : await analytics
                .getBillingUsage({
                  subscriptionItemId: item.id,
                  projectId: item.projectId,
                  customerId: customer.id,
                  // get usage for the current cycle
                  start: invoice.cycleStartAt,
                  end: invoice.cycleEndAt,
                })
                .then((usage) => {
                  return usage.data[0]
                })

          // here we replace _all with the aggregation method because tinybird returns without _all as a key
          const units = usage
            ? (usage[
                item.featurePlanVersion.aggregationMethod.replace("_all", "") as keyof typeof usage
              ] as number) || 0
            : 0

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
          // if the aggregation method is _all we get the usage for all time
          if (invoice.previousCycleStartAt && invoice.previousCycleEndAt) {
            // get usage for the current cycle
            const usage = item.featurePlanVersion.aggregationMethod.endsWith("_all")
              ? await analytics
                  .getBillingUsage({
                    subscriptionItemId: item.id,
                    customerId: customer.id,
                    projectId: invoice.projectId,
                  })
                  .then((usage) => usage.data[0])
              : await analytics
                  .getBillingUsage({
                    subscriptionItemId: item.id,
                    customerId: customer.id,
                    projectId: invoice.projectId,
                    start: invoice.previousCycleStartAt,
                    end: invoice.previousCycleEndAt,
                  })
                  .then((usage) => usage.data[0])

            // here we replace _all with the aggregation method because tinybird returns without _all as a key
            const units = usage
              ? (usage[
                  item.featurePlanVersion.aggregationMethod.replace(
                    "_all",
                    ""
                  ) as keyof typeof usage
                ] as number) || 0
              : 0

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
        const startDate = new Date(invoice.cycleStartAt)
        const endDate = new Date(invoice.cycleEndAt)
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

export const collectInvoicePayment = async (payload: {
  invoiceId: string
  projectId: string
  logger: Logger
  now: number
}): Promise<Result<FinalizeInvoiceResult, UnPriceSubscriptionError>> => {
  const { invoiceId, projectId, logger, now } = payload

  // Get invoice details
  const invoice = await db.query.invoices.findFirst({
    where: (table, { eq, and }) => and(eq(table.id, invoiceId), eq(table.projectId, projectId)),
  })

  if (!invoice) {
    return Err(new UnPriceSubscriptionError({ message: "Invoice not found" }))
  }

  const MAX_PAYMENT_ATTEMPTS = 10
  const invoicePaymentProviderId = invoice.invoicePaymentProviderId
  const paymentMethodId = invoice.paymentMethodId

  // if the invoice is draft, we can't collect the payment
  if (invoice.status === "draft") {
    return Err(
      new UnPriceSubscriptionError({ message: "Invoice is not finalized, cannot collect payment" })
    )
  }

  // check if the invoice is already paid or void
  if (["paid", "void"].includes(invoice.status)) {
    return Ok({
      invoice,
    })
  }

  // validate if the invoice is failed
  if (invoice.status === "failed") {
    // meaning the invoice is past due and we cannot collect the payment with 3 attempts
    return Err(
      new UnPriceSubscriptionError({ message: "Invoice is failed, cannot collect payment" })
    )
  }

  // check if the invoice has an invoice id from the payment provider
  if (!invoicePaymentProviderId) {
    return Err(
      new UnPriceSubscriptionError({
        message:
          "Invoice has no invoice id from the payment provider, please finalize the invoice first",
      })
    )
  }

  // check if the invoice has a payment method id
  // this shouldn't happen but we add a check anyway just in case
  if (!paymentMethodId || paymentMethodId === "") {
    return Err(
      new UnPriceSubscriptionError({
        message: "Invoice requires a payment method, please set a payment method first",
      })
    )
  }

  // Get subscription data with related entities
  const subscriptionData = await db.query.subscriptions.findFirst({
    where: (table, { eq, and }) =>
      and(eq(table.id, invoice.subscriptionId), eq(table.projectId, projectId)),
    with: {
      customer: true,
      phases: {
        where(fields, operators) {
          return operators.and(
            operators.eq(fields.id, invoice.subscriptionPhaseId),
            operators.eq(fields.projectId, projectId)
          )
        },
        with: {
          planVersion: true,
          items: {
            with: {
              featurePlanVersion: {
                with: {
                  feature: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!subscriptionData) {
    return Err(new UnPriceSubscriptionError({ message: "Subscription not found" }))
  }

  const { phases, customer } = subscriptionData
  const phase = phases[0]

  if (!phase) {
    return Err(
      new UnPriceSubscriptionError({
        message: `Subscription phase ${invoice.subscriptionPhaseId} not found`,
      })
    )
  }

  // Get payment provider config
  const config = await db.query.paymentProviderConfig.findFirst({
    where: (config, { and, eq }) =>
      and(
        eq(config.projectId, customer.projectId),
        eq(config.paymentProvider, invoice.paymentProvider),
        eq(config.active, true)
      ),
  })

  if (!config) {
    return Err(
      new UnPriceSubscriptionError({
        message: "Payment provider config not found or not active",
      })
    )
  }

  // Initialize payment provider
  const aesGCM = await AesGCM.withBase64Key(env.ENCRYPTION_KEY)
  const decryptedKey = await aesGCM.decrypt({
    iv: config.keyIv,
    ciphertext: config.key,
  })

  const paymentProviderService = new PaymentProviderService({
    customer,
    paymentProvider: invoice.paymentProvider,
    logger,
    token: decryptedKey,
  })

  // if the invoice is waiting, we need to check if the payment is successful
  // waiting mean we sent the invoice to the customer and we are waiting for the payment (manual payment)
  if (invoice.status === "waiting") {
    // check the status of the payment in the payment provider
    const statusPaymentProviderInvoice = await paymentProviderService.getStatusInvoice({
      invoiceId: invoicePaymentProviderId,
    })

    if (statusPaymentProviderInvoice.err) {
      return Err(new UnPriceSubscriptionError({ message: "Error getting invoice status" }))
    }

    // if the invoice is paid or void, we update the invoice status
    if (["paid", "void"].includes(statusPaymentProviderInvoice.val.status)) {
      // update the invoice status
      const updatedInvoice = await db
        .update(invoices)
        .set({
          status: statusPaymentProviderInvoice.val.status as InvoiceStatus,
          paidAt: statusPaymentProviderInvoice.val.paidAt,
          invoicePaymentProviderUrl: statusPaymentProviderInvoice.val.invoiceUrl,
          paymentAttempts: [
            ...(invoice.paymentAttempts ?? []),
            ...statusPaymentProviderInvoice.val.paymentAttempts,
          ],
          metadata: {
            ...(invoice.metadata ?? {}),
            reason: "payment_received",
            note:
              statusPaymentProviderInvoice.val.status === "paid"
                ? "Invoice paid successfully"
                : "Invoice voided",
          },
        })
        .where(eq(invoices.id, invoice.id))
        .returning()
        .then((res) => res[0])

      if (!updatedInvoice) {
        return Err(new UnPriceSubscriptionError({ message: "Error updating invoice" }))
      }

      return Ok({
        invoice: updatedInvoice,
      })
    }

    // 3 attempts max for the invoice and the past due date is suppased
    if (
      (invoice.paymentAttempts?.length && invoice.paymentAttempts.length >= MAX_PAYMENT_ATTEMPTS) ||
      (invoice.pastDueAt && invoice.pastDueAt < now)
    ) {
      // update the invoice status
      const updatedInvoice = await db
        .update(invoices)
        .set({
          status: "failed",
          metadata: {
            reason: "pending_expiration",
            note: "Invoice has reached the maximum number of payment attempts and the past due date is suppased",
          },
        })
        .where(eq(invoices.id, invoice.id))
        .returning()
        .then((res) => res[0])

      if (!updatedInvoice) {
        return Err(new UnPriceSubscriptionError({ message: "Error updating invoice" }))
      }

      return Ok({
        invoice: updatedInvoice,
      })
    }
  }

  // collect the payment depending on the collection method
  // collect automatically means we will try to collect the payment with the default payment method
  if (invoice.collectionMethod === "charge_automatically") {
    const stripePaymentInvoice = await paymentProviderService.collectPayment({
      invoiceId: invoicePaymentProviderId,
      paymentMethodId: paymentMethodId,
    })

    if (stripePaymentInvoice.err) {
      // update the attempt if the payment failed
      await db
        .update(invoices)
        .set({
          // set the intempts to failed
          paymentAttempts: [
            ...(invoice.paymentAttempts ?? []),
            { status: "failed", createdAt: Date.now() },
          ],
          metadata: {
            reason: "payment_failed",
            note: `Payment failed: ${stripePaymentInvoice.err.message}`,
          },
        })
        .where(eq(invoices.id, invoice.id))

      return Err(
        new UnPriceSubscriptionError({
          message: `Error collecting payment: ${stripePaymentInvoice.err.message}`,
        })
      )
    }

    const paymentStatus = stripePaymentInvoice.val.status
    const isPaid = ["paid", "void"].includes(paymentStatus)

    // update the invoice status if the payment is successful
    // if not add the failed attempt
    const updatedInvoice = await db
      .update(invoices)
      .set({
        status: isPaid ? "paid" : "unpaid",
        ...(isPaid ? { paidAt: Date.now() } : {}),
        ...(isPaid ? { invoicePaymentProviderUrl: stripePaymentInvoice.val.invoiceUrl } : {}),
        paymentAttempts: [
          ...(invoice.paymentAttempts ?? []),
          {
            status: isPaid ? "paid" : paymentStatus,
            createdAt: Date.now(),
          },
        ],
        metadata: {
          ...(invoice.metadata ?? {}),
          reason: isPaid ? "payment_received" : "payment_pending",
          note: isPaid ? "Invoice paid successfully" : `Payment pending for ${paymentStatus}`,
        },
      })
      .where(eq(invoices.id, invoice.id))
      .returning()
      .then((res) => res[0])

    if (!updatedInvoice) {
      return Err(new UnPriceSubscriptionError({ message: "Error updating invoice" }))
    }

    return Ok({
      invoice: updatedInvoice,
    })
  }

  // send the invoice to the customer and wait for the payment
  if (invoice.collectionMethod === "send_invoice") {
    const stripeSendInvoice = await paymentProviderService.sendInvoice({
      invoiceId: invoicePaymentProviderId,
    })

    if (stripeSendInvoice.err) {
      return Err(
        new UnPriceSubscriptionError({
          message: `Error sending invoice: ${stripeSendInvoice.err.message}`,
        })
      )
    }

    // update the invoice status if send invoice is successful
    const updatedInvoice = await db
      .update(invoices)
      .set({
        status: "waiting",
        sentAt: Date.now(),
        metadata: {
          ...(invoice.metadata ?? {}),
          reason: "payment_pending",
          note: "Invoice sent to the customer, waiting for payment",
        },
      })
      .where(eq(invoices.id, invoice.id))
      .returning()
      .then((res) => res[0])

    if (!updatedInvoice) {
      return Err(new UnPriceSubscriptionError({ message: "Error updating invoice" }))
    }

    return Ok({
      invoice: updatedInvoice,
    })
  }

  return Err(new UnPriceSubscriptionError({ message: "Unsupported status for invoice" }))
}
