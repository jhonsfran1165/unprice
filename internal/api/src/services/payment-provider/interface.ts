import type { CollectionMethod, Currency } from "@unprice/db/validators"
import type { FetchError, Result } from "@unprice/error"
import type { Stripe } from "@unprice/stripe"
import type { UnPricePaymentProviderError } from "./errors"

export interface PaymentProviderCreateSession {
  success: boolean
  url: string
  customerId: string
}

export interface PaymentProviderGetSession {
  metadata: {
    [name: string]: string
  } | null
  customerId: string
  subscriptionId: string | null
}

export interface GetSessionOpts {
  sessionId: string
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
  customer: { id: string; email: string; currency: string; projectId: string }
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
  dueDate?: number
}

export interface UpdateInvoiceOpts {
  invoiceId: string
  startCycle: number
  endCycle: number
  collectionMethod: CollectionMethod
  description: string
  dueDate?: number
}

export interface AddInvoiceItemOpts {
  invoiceId: string
  name: string
  productId?: string
  description?: string
  isProrated: boolean
  totalAmount: number
  unitAmount?: number
  quantity: number
  currency: Currency
  metadata?: Record<string, string>
}

export interface UpdateInvoiceItemOpts {
  invoiceItemId: string
  totalAmount: number
  name: string
  isProrated: boolean
  quantity: number
  metadata?: Record<string, string>
  description?: string
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
  invoiceUrl: string
  paymentAttempts: {
    status: string
    createdAt: number
  }[]
}

export type PaymentProviderInvoice = {
  invoiceUrl: string
  status: InvoiceProviderStatus | null
  invoiceId: string
  total: number
  items: {
    id: string
    amount: number
    description: string
    productId: string
    currency: Currency
    quantity: number
    metadata?: Record<string, string>
  }[]
}

export type InvoiceProviderStatus =
  | "open"
  | "paid"
  | "void"
  | "draft"
  | "uncollectible"
  | "past_due"

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
  ) => Promise<Result<PaymentProviderInvoice, FetchError | UnPricePaymentProviderError>>

  updateInvoice: (
    opts: UpdateInvoiceOpts
  ) => Promise<Result<PaymentProviderInvoice, FetchError | UnPricePaymentProviderError>>

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
    Result<
      { invoiceId: string; status: InvoiceProviderStatus },
      FetchError | UnPricePaymentProviderError
    >
  >

  getStatusInvoice: (opts: { invoiceId: string }) => Promise<
    Result<GetStatusInvoice, FetchError | UnPricePaymentProviderError>
  >

  getInvoice: (opts: { invoiceId: string }) => Promise<
    Result<PaymentProviderInvoice, FetchError | UnPricePaymentProviderError>
  >

  updateInvoiceItem: (
    opts: UpdateInvoiceItemOpts
  ) => Promise<Result<void, FetchError | UnPricePaymentProviderError>>
}
