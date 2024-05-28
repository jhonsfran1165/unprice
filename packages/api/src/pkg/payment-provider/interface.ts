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
  }) => Promise<Result<PaymentProviderCreateSession, FetchError>>
}
