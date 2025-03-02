import type {
  Customer,
  Subscription,
  SubscriptionInvoice,
  SubscriptionPhaseExtended,
} from "@unprice/db/validators"

// State machine types
export interface SubscriptionContext {
  subscriptionId: string
  projectId: string
  // Current subscription data
  subscription: Subscription
  customer: Customer
  paymentMethodId: string | null
  requiredPaymentMethod: boolean
  // All phases, including past, current, and future
  phases: Array<SubscriptionPhaseExtended>
  // Current active phase for convenience
  currentPhase: SubscriptionPhaseExtended | null
  openInvoices: Array<SubscriptionInvoice>
  error?: {
    message: string
  }
}

// Update the SubscriptionEvent type to include these events
export type SubscriptionEvent =
  | { type: "TRIAL_END" }
  | { type: "RENEW" }
  | { type: "RESTORE" }
  | { type: "PAYMENT_FAILURE" }
  | { type: "PAYMENT_SUCCESS" }
  | { type: "CANCEL" }
  | { type: "CHANGE" }
  | { type: "INVOICE" }

export type SubscriptionGuards = {
  type:
  | "isTrialExpired"
  | "canRenew"
  | "hasValidPaymentMethod"
  | "canInvoice"
  | "isAlreadyRenewed"
  | "isAutoRenewEnabled"
  | "isAlreadyInvoiced"
}

export type SubscriptionActions = {
  type:
  | "logStateTransition"
  | "notifyCustomer"
}

export type MachineTags = "subscription" | "machine"
