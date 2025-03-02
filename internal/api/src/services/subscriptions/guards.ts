import { configureBillingCycleSubscription } from "@unprice/db/validators"
import type { SubscriptionContext } from "./types"

/**
 * Guard: Check if subscription can be renewed using context data
 */
export const canRenew = (input: { context: SubscriptionContext }): boolean => {
  const subscription = input.context.subscription

  if (!input.context.currentPhase) return false

  const billingCycle = configureBillingCycleSubscription({
    currentCycleStartAt: subscription.currentCycleEndAt,
    billingConfig: input.context.currentPhase.planVersion.billingConfig,
    trialDays: input.context.currentPhase.trialDays,
    endAt: input.context.currentPhase.endAt ?? undefined,
    alignStartToDay: false,
    alignEndToDay: true,
    alignToCalendar: true,
  })

  // if the next billing period interferes with a change, cancel, expire or past due then we can't renew
  if (subscription.metadata?.dates?.changeAt && billingCycle.cycleStartMs < subscription.metadata?.dates?.changeAt) {
    return false
  }

  if (subscription.metadata?.dates?.cancelAt && billingCycle.cycleStartMs < subscription.metadata?.dates?.cancelAt) {
    return false
  }

  if (subscription.metadata?.dates?.expiresAt && billingCycle.cycleStartMs < subscription.metadata?.dates?.expiresAt) {
    return false
  }

  if (subscription.metadata?.dates?.pastDueAt && billingCycle.cycleStartMs < subscription.metadata?.dates?.pastDueAt) {
    return false
  }

  return true
}

export const isAlreadyRenewed = (input: { context: SubscriptionContext }): boolean => {
  const subscription = input.context.subscription

  if (!subscription) return false

  const alreadyRenewed =
    subscription.metadata?.dates?.lastRenewAt && subscription.metadata?.dates?.lastRenewAt >= subscription.nextInvoiceAt

  return alreadyRenewed === true
}

export const isAutoRenewEnabled = (input: { context: SubscriptionContext }): boolean => {
  const currentPhase = input.context.currentPhase

  if (!currentPhase) return false

  return currentPhase.planVersion.autoRenew
}

/**
 * Guard: Check if trial period has expired
 */
export const isTrialExpired = (input: { context: SubscriptionContext }): boolean => {
  if (!input.context.currentPhase) return false
  const now = Date.now()
  const trialEndsAt = input.context.currentPhase.trialEndsAt

  if (!trialEndsAt) {
    return false
  }

  if (trialEndsAt > now) {
    return false
  }

  return true
}

export const hasValidPaymentMethod = (input: { context: SubscriptionContext }): boolean => {
  const paymentMethodId = input.context.paymentMethodId
  const requiredPaymentMethod = input.context.requiredPaymentMethod

  if (!requiredPaymentMethod) return true

  return paymentMethodId !== null
}

export const canInvoice = (input: { context: SubscriptionContext }): boolean => {
  const subscription = input.context.subscription
  const now = Date.now()

  if (subscription.nextInvoiceAt && subscription.nextInvoiceAt > now) {
    return false
  }

  return true
}

export const isAlreadyInvoiced = (input: { context: SubscriptionContext }): boolean => {
  const subscription = input.context.subscription

  const alreadyInvoiced =
    subscription.metadata?.dates?.lastInvoiceAt && subscription.metadata?.dates?.lastInvoiceAt >= subscription.nextInvoiceAt

  return alreadyInvoiced === true
}
