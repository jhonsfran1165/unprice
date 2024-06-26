import { API_DOMAIN } from "@builderai/config"
import type { Result } from "@builderai/error"
import { Err, FetchError, Ok } from "@builderai/error"
import { Stripe, stripe } from "@builderai/stripe"

import type { Logger } from "@builderai/logging"
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

        return Ok({ success: true as const, url: session.url })
      }

      // do not use `new URL(...).searchParams` here, because it will escape the curly braces and stripe will not replace them with the session id
      // we pass urls as metadata and the call one of our endpoints to handle the session validation and then redirect the user to the success or cancel url
      const apiCallbackUrl = `${API_DOMAIN}/payment/stripe?session_id={CHECKOUT_SESSION_ID}`

      // create a new session for registering a payment method
      const session = await this.client.checkout.sessions.create({
        client_reference_id: opts.customerId,
        customer_email: opts.email,
        billing_address_collection: "auto",
        mode: "setup",
        metadata: {
          successUrl: opts.successUrl,
          cancelUrl: opts.cancelUrl,
          customerId: opts.customerId,
          projectId: opts.projectId,
        },
        success_url: apiCallbackUrl,
        cancel_url: opts.cancelUrl,
        currency: opts.currency,
        customer_creation: "always",
      })

      if (!session.url) return Ok({ success: false as const, url: "" })

      return Ok({ success: true as const, url: session.url })
    } catch (error) {
      const e = error as Error

      this.logger.error("Error creating session", {
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
      FetchError
    >
  > {
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
}
