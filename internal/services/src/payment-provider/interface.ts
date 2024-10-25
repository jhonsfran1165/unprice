import type { Currency } from "@unprice/db/validators"
import type { FetchError, Result } from "@unprice/error"
import type { Stripe } from "@unprice/stripe"
import type { UnPricePaymentProviderError } from "./errors"

export interface PaymentProviderCreateSession {
  success: boolean
  url: string
  customerId: string
}

// Cache interface so you can swap out the cache implementation
export interface PaymentProviderInterface {
  createSession: (opts: {
    currency: string
    customerId: string
    projectId: string
    email: string
    successUrl: string
    cancelUrl: string
  }) => Promise<Result<PaymentProviderCreateSession, FetchError>>

  signUp: (opts: {
    customer: {
      id: string
      email: string
      currency: string
    }
    customerSessionId: string
    successUrl: string
    cancelUrl: string
  }) => Promise<Result<PaymentProviderCreateSession, FetchError>>

  getProduct: (id: string) => Promise<Result<Stripe.Response<Stripe.Product>, FetchError>>
  createProduct: (opts: Stripe.ProductCreateParams) => Promise<Result<Stripe.Product, FetchError>>
  upsertProduct: (
    props: Stripe.ProductCreateParams & { id: string }
  ) => Promise<Result<Stripe.Product, FetchError>>

  listPaymentMethods: (opts: { limit?: number }) => Promise<
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
  >

  createInvoice: (opts: {
    currency: Currency
    customerName: string
    email: string
    startCycle: number
    endCycle: number
  }) => Promise<Result<{ invoice: Stripe.Invoice }, FetchError | UnPricePaymentProviderError>>

  addInvoiceItem: (opts: {
    invoiceId: string
    name: string
    productId: string
    isProrated: boolean
    amount: number
    quantity: number
    currency: Currency
  }) => Promise<Result<void, FetchError | UnPricePaymentProviderError>>

  getDefaultPaymentMethodId: () => Promise<Result<string, FetchError | UnPricePaymentProviderError>>
}
