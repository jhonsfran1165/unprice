import type {
  Customer,
  Subscription,
  SubscriptionPhaseExtended,
  SubscriptionStatus,
} from "@unprice/db/validators"

export type SusbriptionMachineStatus =
  | SubscriptionStatus
  | "loading"
  | "error"
  | "success"
  | "restored"

// State machine types
export interface SubscriptionContext {
  // Current time in milliseconds for the machine
  now: number
  subscriptionId: string
  projectId: string
  // Current subscription data
  subscription: Subscription
  customer: Customer
  paymentMethodId: string | null
  requiredPaymentMethod: boolean
  // Current active phase for convenience
  currentPhase: SubscriptionPhaseExtended | null
  error?: {
    message: string
  }
}

// Update the SubscriptionEvent type to include these events
export type SubscriptionEvent =
  | { type: "TRIAL_END" }
  | { type: "RENEW" }
  | { type: "RESTORE" }
  | { type: "PAYMENT_FAILURE"; invoiceId: string; error: string }
  | { type: "PAYMENT_SUCCESS"; invoiceId: string }
  | { type: "INVOICE_SUCCESS"; invoiceId: string }
  | { type: "INVOICE_FAILURE"; invoiceId: string; error: string }
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
    | "currentPhaseNull"
}

export type SubscriptionActions = {
  type: "logStateTransition" | "notifyCustomer"
}

export type MachineTags =
  | "subscription"
  | "machine"
  | "loading"
  | "error"
  | "trialing"
  | "invoicing"
  | "ending"
  | "active"
  | "renewing"
