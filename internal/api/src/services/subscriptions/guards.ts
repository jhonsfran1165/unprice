import { configureBillingCycleSubscription } from "@unprice/db/validators"
import type { SubscriptionContext } from "./types"

/**
 * Guard: Check if subscription can be renewed using context data
 */
export const canRenew = (input: { context: SubscriptionContext }): boolean => {
  const subscription = input.context.subscription

  if (!input.context.currentPhase) return false

  const now = input.context.now

  const billingCycle = configureBillingCycleSubscription({
    currentCycleStartAt: subscription.currentCycleEndAt,
    billingConfig: input.context.currentPhase.planVersion.billingConfig,
    trialDays: input.context.currentPhase.trialDays,
    endAt: input.context.currentPhase.endAt ?? undefined,
    alignStartToDay: false,
    alignEndToDay: true,
    alignToCalendar: true,
  })

  // if the next renewal period has already passed then we can't renew
  if (subscription.renewAt && subscription.renewAt > now) {
    return false
  }

  // if the next billing period interferes with a cancellation then we can't renew
  if (subscription.metadata?.dates?.cancelAt && billingCycle.cycleStartMs < subscription.metadata?.dates?.cancelAt) {
    return false
  }

  // TODO: add more guards here for expiration, change, etc

  return true
}

export const isAlreadyRenewed = (input: { context: SubscriptionContext }): boolean => {
  const subscription = input.context.subscription
  const currentPhase = input.context.currentPhase

  if (!subscription || !currentPhase) return false

  // meaning if the current phase last renew is in the current cycle
  const lastRenewAt = subscription.lastRenewAt
  const currentCycleEndAt = subscription.currentCycleEndAt
  const currentCycleStartAt = subscription.currentCycleStartAt
  const now = input.context.now

  const isLastRenewInCurrentCycle = lastRenewAt && lastRenewAt >= currentCycleStartAt && lastRenewAt <= currentCycleEndAt

  return Boolean(
    !isLastRenewInCurrentCycle &&
    subscription.renewAt >= now
  )
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
  const now = input.context.now
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
  const now = input.context.now

  // only invoice if the next invoice is in the future
  if (subscription.invoiceAt && now > subscription.invoiceAt) {
    return true
  }

  return false
}

export const currentPhaseNull = (input: { context: SubscriptionContext }): boolean => {
  const currentPhase = input.context.currentPhase
  return !currentPhase?.id
}

export const isAlreadyInvoiced = (input: { context: SubscriptionContext }): boolean => {
  const subscription = input.context.subscription
  const currentPhase = input.context.currentPhase

  if (!currentPhase) return false

  // meaning if the current phase last invoice is in the current cycle
  const lastInvoiceAt = subscription.lastInvoiceAt
  const currentCycleEndAt = subscription.currentCycleEndAt
  const currentCycleStartAt = subscription.currentCycleStartAt
  const now = input.context.now

  const isLastInvoiceInCurrentCycle = lastInvoiceAt && lastInvoiceAt >= currentCycleStartAt && lastInvoiceAt <= currentCycleEndAt

  return Boolean(
    !isLastInvoiceInCurrentCycle &&
    subscription.invoiceAt >= now
  )
}

