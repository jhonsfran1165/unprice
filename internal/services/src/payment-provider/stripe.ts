import { API_DOMAIN } from "@unprice/config"
import type { Currency } from "@unprice/db/validators"
import type { Result } from "@unprice/error"
import { Err, FetchError, Ok } from "@unprice/error"
import type { Logger } from "@unprice/logging"
import { Stripe, stripe } from "@unprice/stripe"
import { UnPricePaymentProviderError } from "./errors"
import type {
  AddInvoiceItemOpts,
  CreateInvoiceOpts,
  CreateSessionOpts,
  GetStatusInvoice,
  PaymentMethod,
  PaymentProviderCreateSession,
  PaymentProviderInterface,
  SignUpOpts,
} from "./interface"

export class StripePaymentProvider implements PaymentProviderInterface {
  private readonly client: Stripe
  private readonly providerCustomerId?: string | null
  private readonly logger: Logger

  constructor(opts: { token?: string; providerCustomerId?: string | null; logger: Logger }) {
    this.providerCustomerId = opts?.providerCustomerId
    this.logger = opts?.logger

    if (opts?.token) {
      this.client = new Stripe(opts.token, {
        apiVersion: "2023-10-16",
        typescript: true,
      })
    } else {
      this.client = stripe
    }
  }

  public async upsertProduct(
    props: Stripe.ProductCreateParams & { id: string }
  ): Promise<Result<{ productId: string }, FetchError>> {
    try {
      const { id, type, ...rest } = props
      const product = await this.client.products.retrieve(id).catch(() => null)

      if (product) {
        const updatedProduct = await stripe.products.update(id, {
          ...rest,
        })

        return Ok({ productId: updatedProduct.id })
      }

      return Ok({ productId: (await stripe.products.create(props)).id })
    } catch (error) {
      const e = error as Error

      this.logger.error("Error upserting product", {
        error: JSON.stringify(e.message),
        context: e,
        ...props,
      })

      return Err(
        new FetchError({
          message: e.message,
          retry: true,
        })
      )
    }
  }

  public async signUp(opts: SignUpOpts): Promise<Result<PaymentProviderCreateSession, FetchError>> {
    try {
      // check if customer has a payment method already
      if (this.providerCustomerId) {
        /**
         * Customer is already configured, create a billing portal session
         */
        const session = await this.client.billingPortal.sessions.create({
          customer: this.providerCustomerId,
          return_url: opts.cancelUrl,
        })

        return Ok({ success: true as const, url: session.url, customerId: opts.customer.id })
      }

      // do not use `new URL(...).searchParams` here, because it will escape the curly braces and stripe will not replace them with the session id
      // we pass urls as metadata and the call one of our endpoints to handle the session validation and then redirect the user to the success or cancel url
      const apiCallbackUrl = `${API_DOMAIN}providers/stripe/signup?session_id={CHECKOUT_SESSION_ID}`

      // create a new session for registering a payment method
      const session = await this.client.checkout.sessions.create({
        client_reference_id: opts.customer.id,
        customer_email: opts.customer.email,
        billing_address_collection: "required",
        mode: "setup",
        tax_id_collection: {
          enabled: true,
        },
        metadata: {
          successUrl: opts.successUrl,
          cancelUrl: opts.cancelUrl,
          customerSessionId: opts.customerSessionId,
        },
        success_url: apiCallbackUrl,
        cancel_url: opts.cancelUrl,
        customer_creation: "always",
        currency: opts.customer.currency,
      })

      if (!session.url) return Ok({ success: false as const, url: "", customerId: "" })

      return Ok({ success: true as const, url: session.url, customerId: opts.customer.id })
    } catch (error) {
      const e = error as Stripe.errors.StripeError

      this.logger.error("Error creating session", {
        error: e.message,
        ...opts,
      })

      return Err(
        new FetchError({
          message: e.message,
          retry: true,
        })
      )
    }
  }

  public async createSession(
    opts: CreateSessionOpts
  ): Promise<Result<PaymentProviderCreateSession, FetchError>> {
    try {
      // check if customer has a payment method already
      if (this.providerCustomerId) {
        /**
         * Customer is already configured, create a billing portal session
         */
        const session = await this.client.billingPortal.sessions.create({
          customer: this.providerCustomerId,
          return_url: opts.cancelUrl,
        })

        return Ok({ success: true as const, url: session.url, customerId: opts.customerId })
      }

      // do not use `new URL(...).searchParams` here, because it will escape the curly braces and stripe will not replace them with the session id
      // we pass urls as metadata and the call one of our endpoints to handle the session validation and then redirect the user to the success or cancel url
      const apiCallbackUrl = `${API_DOMAIN}providers/stripe/payment-method?session_id={CHECKOUT_SESSION_ID}`

      // create a new session for registering a payment method
      const session = await this.client.checkout.sessions.create({
        client_reference_id: opts.customerId,
        customer_email: opts.email,
        billing_address_collection: "required",
        mode: "setup",
        tax_id_collection: {
          enabled: true,
        },
        metadata: {
          successUrl: opts.successUrl,
          cancelUrl: opts.cancelUrl,
          customerId: opts.customerId,
          projectId: opts.projectId,
        },
        success_url: apiCallbackUrl,
        cancel_url: opts.cancelUrl,
        customer_creation: "always",
        currency: opts.currency,
      })

      if (!session.url) return Ok({ success: false as const, url: "", customerId: "" })

      return Ok({ success: true as const, url: session.url, customerId: opts.customerId })
    } catch (error) {
      const e = error as Stripe.errors.StripeError

      this.logger.error("Error creating session", {
        error: e.message,
        ...opts,
      })

      return Err(
        new FetchError({
          message: e.message,
          retry: true,
        })
      )
    }
  }

  public async listPaymentMethods(opts: { limit?: number }): Promise<
    Result<PaymentMethod[], FetchError | UnPricePaymentProviderError>
  > {
    if (!this.providerCustomerId)
      return Err(
        new UnPricePaymentProviderError({ message: "Customer payment provider id not set" })
      )

    try {
      const paymentMethods = await this.client.paymentMethods.list({
        customer: this.providerCustomerId ?? undefined,
        limit: opts.limit,
      })

      return Ok(
        paymentMethods.data.map((pm) => ({
          id: pm.id,
          name: pm.billing_details.name,
          last4: pm.card?.last4,
          expMonth: pm.card?.exp_month,
          expYear: pm.card?.exp_year,
          brand: pm.card?.brand,
        }))
      )
    } catch (error) {
      const e = error as Error

      this.logger.error("Error listing payment methods", {
        error: e,
        ...opts,
      })

      return Err(
        new FetchError({
          message: e.message,
          retry: true,
        })
      )
    }
  }

  public async createInvoice(
    opts: CreateInvoiceOpts
  ): Promise<
    Result<{ invoiceId: string; invoiceUrl: string }, FetchError | UnPricePaymentProviderError>
  > {
    if (!this.providerCustomerId)
      return Err(
        new UnPricePaymentProviderError({ message: "Customer payment provider id not set" })
      )

    const billingPeriod = `${new Date(opts.startCycle).toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    })} - ${new Date(opts.endCycle).toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    })}`

    // const dueDate only if collection method is send_invoice
    let dueDate: number | undefined
    if (opts.collectionMethod === "send_invoice") {
      dueDate = opts.dueDate ? Math.floor(opts.dueDate / 1000) : undefined
    }

    // create an invoice
    const result = await this.client.invoices
      .create({
        customer: this.providerCustomerId,
        currency: opts.currency,
        auto_advance: false,
        collection_method: opts.collectionMethod,
        description: opts.description,
        due_date: dueDate,
        custom_fields: [
          {
            name: "Customer",
            value: opts.customerName,
          },
          {
            name: "Email",
            value: opts.email,
          },
          {
            name: "Billing Period",
            value: billingPeriod,
          },
        ],
      })
      .then((invoice) => Ok({ invoiceId: invoice.id, invoiceUrl: invoice.invoice_pdf ?? "" }))
      .catch((error) => {
        const e = error as Stripe.errors.StripeError

        this.logger.error("Error creating invoice", { error: e.message, ...opts })

        return Err(new FetchError({ message: e.message, retry: false }))
      })

    return result
  }

  async addInvoiceItem(
    opts: AddInvoiceItemOpts
  ): Promise<Result<void, FetchError | UnPricePaymentProviderError>> {
    if (!this.providerCustomerId)
      return Err(
        new UnPricePaymentProviderError({ message: "Customer payment provider id not set" })
      )

    const {
      invoiceId,
      name,
      productId,
      isProrated,
      amount,
      quantity,
      currency,
      description,
      metadata,
    } = opts

    const descriptionItem = description ?? (isProrated ? `${name} (prorated)` : name)

    // price data for the invoice item
    // if the product we send price data, otherwise we send the amount
    const priceData = productId
      ? {
          quantity: quantity,
          price_data: {
            currency: currency,
            product: productId,
            unit_amount: amount,
          },
        }
      : {
          currency: currency,
          amount: amount,
        }

    return await this.client.invoiceItems
      .create({
        customer: this.providerCustomerId,
        invoice: invoiceId,
        ...priceData,
        description: descriptionItem,
        metadata,
      })
      .then(() => Ok(undefined))
      .catch((error) => {
        const e = error as Stripe.errors.StripeError

        this.logger.error("Error adding invoice item", { error: e.message, ...opts })

        return Err(new FetchError({ message: e.message, retry: false }))
      })
  }

  public async collectPayment(opts: {
    invoiceId: string
    paymentMethodId: string
  }): Promise<Result<void, FetchError | UnPricePaymentProviderError>> {
    try {
      await this.client.invoices.pay(opts.invoiceId, {
        payment_method: opts.paymentMethodId,
      })

      return Ok(undefined)
    } catch (error) {
      const e = error as Stripe.errors.StripeError

      this.logger.error("Error collecting payment", { error: e.message, ...opts })

      return Err(new FetchError({ message: e.message, retry: false }))
    }
  }

  public async getStatusInvoice(opts: {
    invoiceId: string
  }): Promise<Result<GetStatusInvoice, FetchError | UnPricePaymentProviderError>> {
    try {
      const invoice = await this.client.invoices.retrieve(opts.invoiceId)

      if (!invoice.status) {
        return Err(new UnPricePaymentProviderError({ message: "Invoice status not found" }))
      }

      let paidAt: number | undefined
      let voidedAt: number | undefined
      let paymentAttempts: {
        status: string
        createdAt: number
      }[] = []

      // Check if the invoice is paid
      if (invoice.paid) {
        if (invoice.payment_intent) {
          // The payment_intent object contains details about the payment
          const paymentIntent = await this.client.paymentIntents.retrieve(
            invoice.payment_intent as string
          )

          paidAt = paymentIntent.created

          paymentAttempts = [
            {
              status: paymentIntent.status,
              createdAt: paymentIntent.created, // Unix timestamp
            },
          ]
        }
      }

      // TODO: fix this
      if (invoice.status === "void") {
        voidedAt = invoice.created
      }

      return Ok({
        status: invoice.status,
        invoiceId: invoice.id,
        paidAt,
        voidedAt,
        invoicePdf: invoice.invoice_pdf ?? "",
        paymentAttempts,
        items: invoice.lines.data.map((item) => ({
          id: item.id,
          amount: item.amount,
          description: item.description ?? "",
          currency: item.currency as Currency,
          quantity: item.quantity ?? 0,
          productId: (item.price?.product as string) ?? "",
          metadata: item.metadata,
        })),
      })
    } catch (error) {
      const e = error as Stripe.errors.StripeError

      this.logger.error("Error getting invoice status", { error: e.message, ...opts })

      return Err(new FetchError({ message: e.message, retry: false }))
    }
  }

  public async sendInvoice(opts: {
    invoiceId: string
  }): Promise<Result<void, FetchError | UnPricePaymentProviderError>> {
    try {
      await this.client.invoices.sendInvoice(opts.invoiceId)

      return Ok(undefined)
    } catch (error) {
      const e = error as Stripe.errors.StripeError

      this.logger.error("Error sending invoice", { error: e.message, ...opts })

      return Err(new FetchError({ message: e.message, retry: false }))
    }
  }

  public async finalizeInvoice(opts: {
    invoiceId: string
  }): Promise<Result<{ invoiceId: string }, FetchError | UnPricePaymentProviderError>> {
    try {
      const invoice = await this.client.invoices.finalizeInvoice(opts.invoiceId)

      return Ok({ invoiceId: invoice.id })
    } catch (error) {
      const e = error as Stripe.errors.StripeError

      this.logger.error("Error finalizing invoice", { error: e.message, ...opts })

      return Err(new FetchError({ message: e.message, retry: false }))
    }
  }

  public async getDefaultPaymentMethodId(): Promise<
    Result<{ paymentMethodId: string }, FetchError | UnPricePaymentProviderError>
  > {
    if (!this.providerCustomerId)
      return Err(
        new UnPricePaymentProviderError({ message: "Customer payment provider id not set" })
      )

    const paymentMethods = await this.client.paymentMethods.list({
      customer: this.providerCustomerId,
      limit: 1,
    })

    const paymentMethod = paymentMethods.data.at(0)

    if (!paymentMethod) {
      return Err(new UnPricePaymentProviderError({ message: "No payment methods found" }))
    }

    return Ok({ paymentMethodId: paymentMethod.id })
  }
}
