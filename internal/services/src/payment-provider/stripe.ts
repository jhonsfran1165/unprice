import { API_DOMAIN } from "@unprice/config"
import type { Currency } from "@unprice/db/validators"
import type { Result } from "@unprice/error"
import { Err, FetchError, Ok } from "@unprice/error"
import type { Logger } from "@unprice/logging"
import { Stripe, stripe } from "@unprice/stripe"
import { UnPricePaymentProviderError } from "./errors"
import type { PaymentProviderCreateSession, PaymentProviderInterface } from "./interface"

export class StripePaymentProvider implements PaymentProviderInterface {
  private readonly client: Stripe
  private readonly paymentCustomerId?: string | null
  private readonly logger: Logger

  constructor(opts: { token?: string; paymentCustomerId?: string | null; logger: Logger }) {
    this.paymentCustomerId = opts?.paymentCustomerId
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

  public async getProduct(id: string) {
    const product = await this.client.products.retrieve(id)

    return Ok(product)
  }

  public async createProduct({
    id,
    name,
    type,
    description,
  }: Stripe.ProductCreateParams): Promise<Result<Stripe.Product, FetchError>> {
    try {
      const product = await this.client.products.create({
        id: id,
        name: name,
        type: type,
        description: description,
      })

      return Ok(product)
    } catch (error) {
      const e = error as Error

      this.logger.error("Error creating product", {
        error: e,
        id,
        name,
        type,
        description,
      })

      return Err(
        new FetchError({
          message: e.message,
          retry: true,
        })
      )
    }
  }

  public async upsertProduct(
    props: Stripe.ProductCreateParams & { id: string }
  ): Promise<Result<Stripe.Product, FetchError>> {
    try {
      const { id, type, ...rest } = props
      const product = await this.client.products.retrieve(id).catch(() => null)

      if (product) {
        return Ok(
          await stripe.products.update(id, {
            ...rest,
          })
        )
      }

      return Ok(await stripe.products.create(props))
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

  public async signUp(opts: {
    customer: {
      id: string
      email: string
      currency: string
    }
    customerSessionId: string
    successUrl: string
    cancelUrl: string
  }): Promise<Result<PaymentProviderCreateSession, FetchError>> {
    try {
      // check if customer has a payment method already
      if (this.paymentCustomerId) {
        /**
         * Customer is already configured, create a billing portal session
         */
        const session = await this.client.billingPortal.sessions.create({
          customer: this.paymentCustomerId,
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

  public async createSession(opts: {
    customerId: string
    projectId: string
    email: string
    currency: string
    successUrl: string
    cancelUrl: string
  }): Promise<Result<PaymentProviderCreateSession, FetchError>> {
    try {
      // check if customer has a payment method already
      if (this.paymentCustomerId) {
        /**
         * Customer is already configured, create a billing portal session
         */
        const session = await this.client.billingPortal.sessions.create({
          customer: this.paymentCustomerId,
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
    Result<
      {
        id: string
        name: string | null
        last4?: string
        expMonth?: number
        expYear?: number
        brand?: string
      }[],
      FetchError | UnPricePaymentProviderError
    >
  > {
    if (!this.paymentCustomerId)
      return Err(
        new UnPricePaymentProviderError({ message: "Customer payment provider id not set" })
      )

    try {
      const paymentMethods = await this.client.paymentMethods.list({
        customer: this.paymentCustomerId ?? undefined,
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

  public async createInvoice(opts: {
    currency: Currency
    customerName: string
    email: string
    startCycle: number
    endCycle: number
    collectionMethod: "charge_automatically" | "send_invoice"
    description: string
  }): Promise<Result<{ invoice: Stripe.Invoice }, FetchError | UnPricePaymentProviderError>> {
    if (!this.paymentCustomerId)
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

    // create an invoice
    const result = await this.client.invoices
      .create({
        customer: this.paymentCustomerId,
        currency: opts.currency,
        auto_advance: false,
        collection_method: opts.collectionMethod,
        description: opts.description,
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
      .then((invoice) => Ok({ invoice }))
      .catch((error) => {
        const e = error as Stripe.errors.StripeError

        this.logger.error("Error creating invoice", { error: e.message, ...opts })

        return Err(new FetchError({ message: e.message, retry: false }))
      })

    return result
  }

  async addInvoiceItem(opts: {
    invoiceId: string
    name: string
    productId: string
    isProrated: boolean
    amount: number
    quantity: number
    currency: Currency
  }): Promise<Result<void, FetchError | UnPricePaymentProviderError>> {
    if (!this.paymentCustomerId)
      return Err(
        new UnPricePaymentProviderError({ message: "Customer payment provider id not set" })
      )

    const { invoiceId, name, productId, isProrated, amount, quantity, currency } = opts

    return await this.client.invoiceItems
      .create({
        customer: this.paymentCustomerId,
        invoice: invoiceId,
        quantity: quantity,
        price_data: {
          currency: currency,
          product: productId,
          unit_amount: amount,
        },
        currency: currency,
        description: isProrated ? `${name} (prorated)` : name,
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
  }): Promise<Result<Stripe.Invoice, FetchError | UnPricePaymentProviderError>> {
    try {
      const invoice = await this.client.invoices.finalizeInvoice(opts.invoiceId)

      return Ok(invoice)
    } catch (error) {
      const e = error as Stripe.errors.StripeError

      this.logger.error("Error finalizing invoice", { error: e.message, ...opts })

      return Err(new FetchError({ message: e.message, retry: false }))
    }
  }

  public async getDefaultPaymentMethodId(): Promise<
    Result<string, FetchError | UnPricePaymentProviderError>
  > {
    if (!this.paymentCustomerId)
      return Err(
        new UnPricePaymentProviderError({ message: "Customer payment provider id not set" })
      )

    const paymentMethods = await this.client.paymentMethods.list({
      customer: this.paymentCustomerId,
      limit: 1,
    })

    const paymentMethod = paymentMethods.data.at(0)

    if (!paymentMethod) {
      return Err(new UnPricePaymentProviderError({ message: "No payment methods found" }))
    }

    return Ok(paymentMethod.id)
  }
}
