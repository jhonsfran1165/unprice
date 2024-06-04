import type { FetchError, Result } from "@builderai/error"

export interface PaymentProviderCreateSession {
  success: boolean
  url: string
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
      FetchError
    >
  >
}
