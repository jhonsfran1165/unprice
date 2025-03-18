import type { CustomerEntitlement } from "@unprice/db/validators"

export function isValidEntitlement(entitlement: CustomerEntitlement, now: number) {
  const gracePeriod = entitlement.gracePeriod
  const currentCycleEndAt = entitlement.currentCycleEndAt
  const currentCycleStartAt = entitlement.currentCycleStartAt

  // validate is the billing cycle is active, add the grace period to the end of the cycle
  // grace period is in days, so we need to convert it to milliseconds
  const gracePeriodInMs = gracePeriod * 24 * 60 * 60 * 1000
  const endOfCycle = currentCycleEndAt + gracePeriodInMs

  if (now < currentCycleStartAt || now > endOfCycle) {
    return false
  }

  return true
}
