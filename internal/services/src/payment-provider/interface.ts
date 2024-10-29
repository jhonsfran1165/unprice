import type { CollectionMethod, Currency } from "@unprice/db/validators"
import type { FetchError, Result } from "@unprice/error"
import type { Stripe } from "@unprice/stripe"
import type { UnPricePaymentProviderError } from "./errors"

export interface PaymentProviderCreateSession {
  success: boolean
  url: string
  customerId: string
}

export interface CreateSessionOpts {
  currency: string
  customerId: string
  projectId: string
  email: string
  successUrl: string
  cancelUrl: string
}

export interface SignUpOpts {
  customer: { id: string; email: string; currency: string }
  customerSessionId: string
  successUrl: string
  cancelUrl: string
}

export interface CreateInvoiceOpts {
  currency: Currency
  customerName: string
  email: string
  startCycle: number
  endCycle: number
  collectionMethod: CollectionMethod
  description: string
}

export interface AddInvoiceItemOpts {
  invoiceId: string
  name: string
  productId: string
  isProrated: boolean
  amount: number
  quantity: number
  currency: Currency
}

export type PaymentMethod = {
  id: string
  name: string | null
  last4?: string
  expMonth?: number
  expYear?: number
  brand?: string
}

export type GetStatusInvoice = {
  status: InvoiceProviderStatus
  invoiceId: string
  paidAt?: number
  voidedAt?: number
  invoicePdf?: string
  paymentAttempts: {
    status: string
    createdAt: number
  }[]
}

export type InvoiceProviderStatus = "open" | "paid" | "void" | "draft" | "uncollectible"

// Cache interface so you can swap out the cache implementation
export interface PaymentProviderInterface {
  createSession: (
    opts: CreateSessionOpts
  ) => Promise<Result<PaymentProviderCreateSession, FetchError>>

  signUp: (opts: SignUpOpts) => Promise<Result<PaymentProviderCreateSession, FetchError>>

  upsertProduct: (
    props: Stripe.ProductCreateParams & { id: string }
  ) => Promise<Result<{ productId: string }, FetchError>>

  listPaymentMethods: (opts: { limit?: number }) => Promise<
    Result<PaymentMethod[], FetchError | UnPricePaymentProviderError>
  >

  createInvoice: (
    opts: CreateInvoiceOpts
  ) => Promise<
    Result<{ invoiceId: string; invoiceUrl: string }, FetchError | UnPricePaymentProviderError>
  >

  addInvoiceItem: (
    opts: AddInvoiceItemOpts
  ) => Promise<Result<void, FetchError | UnPricePaymentProviderError>>

  getDefaultPaymentMethodId: () => Promise<
    Result<{ paymentMethodId: string }, FetchError | UnPricePaymentProviderError>
  >

  finalizeInvoice: (opts: { invoiceId: string }) => Promise<
    Result<{ invoiceId: string }, FetchError | UnPricePaymentProviderError>
  >

  sendInvoice: (opts: { invoiceId: string }) => Promise<
    Result<void, FetchError | UnPricePaymentProviderError>
  >

  collectPayment: (opts: { invoiceId: string; paymentMethodId: string }) => Promise<
    Result<void, FetchError | UnPricePaymentProviderError>
  >

  getStatusInvoice: (opts: { invoiceId: string }) => Promise<
    Result<GetStatusInvoice, FetchError | UnPricePaymentProviderError>
  >
}
