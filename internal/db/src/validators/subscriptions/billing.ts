import {
  addDays,
  addMonths,
  addYears,
  differenceInSeconds,
  endOfDay,
  max,
  setDate,
  setMonth,
  startOfDay,
  startOfMonth,
} from "date-fns"
import { type BillingPeriod, convertDateToUTC } from "../shared"

export function configureBillingCycleSubscription({
  startDate,
  trialDays,
  billingCycleStart,
  billingPeriod,
  endDate,
  autoRenew = true,
}: {
  startDate: Date
  trialDays: number
  billingCycleStart: number
  billingPeriod: BillingPeriod
  endDate?: Date
  autoRenew?: boolean
}): {
  cycleStart: Date
  cycleEnd: Date
  secondsInCycle: number
  prorationFactor: number
  billableSeconds: number
  effectiveStartDate: Date
  effectiveEndDate?: Date
  nextBillingAt: Date
  trialDaysEndAt: Date
} {
  // get utc current date
  const currentDate = convertDateToUTC(new Date())
  // calculate the trials, here we don't need to worry about the end of the day because
  // we are calculating the proration to the seconds, after the first cycle the billing starts at midnight
  // and aligns with the start of the day in UTC
  const trialDaysEndAt = addDays(startDate, trialDays)

  // given the current date, calculate the start and end of the current billing cycle
  const { cycleStart, cycleEnd } =
    billingPeriod === "month"
      ? calculateMonthlyBillingCycle(currentDate, billingCycleStart)
      : calculateYearlyBillingCycle(currentDate, billingCycleStart)

  // we want to keep fairness so we calculate the proration to the seconds
  // INFO: if you find some ways we can improve fairness along the whole project please give me a shout
  const effectiveStartDate = max([startDate, cycleStart, trialDaysEndAt])
  // if end date is defined calculate the trial days end at
  let effectiveEndDate = endDate ? max([endDate, trialDaysEndAt]) : undefined
  let effectiveEndCycle = effectiveEndDate ? effectiveEndDate : cycleEnd
  let effectiveStartCycle = effectiveStartDate

  // INFO: this is a special case where the trial days are greater than the billing cycle
  // we need to calculate the next billing date
  if (trialDaysEndAt > cycleEnd) {
    // we need to calculate the next billing date with the trial days end at
    const { cycleEnd, cycleStart } =
      billingPeriod === "month"
        ? calculateMonthlyBillingCycle(trialDaysEndAt, billingCycleStart)
        : calculateYearlyBillingCycle(trialDaysEndAt, billingCycleStart)

    effectiveEndCycle = cycleEnd
    effectiveStartCycle = cycleStart
  }

  if (autoRenew === false) {
    effectiveEndDate = effectiveEndCycle
  }

  const secondsInCycle = differenceInSeconds(effectiveEndCycle, effectiveStartCycle) + 1
  const billableSeconds = Math.max(
    0,
    differenceInSeconds(effectiveEndCycle, effectiveStartDate) + 1
  )
  const prorationFactor = billableSeconds / secondsInCycle

  return {
    cycleStart: convertDateToUTC(cycleStart),
    cycleEnd: convertDateToUTC(cycleEnd),
    secondsInCycle,
    prorationFactor,
    billableSeconds,
    effectiveStartDate: convertDateToUTC(effectiveStartDate),
    effectiveEndDate: effectiveEndDate ? convertDateToUTC(effectiveEndDate) : undefined,
    nextBillingAt: convertDateToUTC(effectiveEndCycle),
    trialDaysEndAt: convertDateToUTC(trialDaysEndAt),
  }
}

// TODO: handle errors
export function calculateBillingCycle({
  startDate,
  billingCycleStart,
  billingPeriod,
}: {
  startDate: Date
  billingCycleStart: number
  billingPeriod: BillingPeriod
}): {
  cycleStart: Date
  cycleEnd: Date
  secondsInCycle: number
  prorationFactor: number
  billableSeconds: number
} {
  // get utc current date
  const currentDate = convertDateToUTC(new Date())

  const { cycleStart, cycleEnd } =
    billingPeriod === "month"
      ? calculateMonthlyBillingCycle(currentDate, billingCycleStart)
      : calculateYearlyBillingCycle(currentDate, billingCycleStart)

  // we want to keep fairness so we calculate the proration to the seconds
  // INFO: if you find some ways we can improve fairness along the whole project please give me a shout
  const secondsInCycle = differenceInSeconds(cycleEnd, cycleStart) + 1
  const effectiveStartDate = startDate < cycleStart ? cycleStart : startDate
  const effectiveEndDate = cycleEnd
  const billableSeconds = differenceInSeconds(effectiveEndDate, effectiveStartDate) + 1
  const prorationFactor = billableSeconds / secondsInCycle

  return {
    cycleStart: convertDateToUTC(cycleStart),
    cycleEnd: convertDateToUTC(cycleEnd),
    secondsInCycle,
    billableSeconds,
    prorationFactor: prorationFactor,
  }
}

function calculateMonthlyBillingCycle(
  currentDate: Date,
  billingCycleStartDay: number
): {
  cycleStart: Date
  cycleEnd: Date
} {
  // Ensure billingCycleStartDay is within valid range (1-31)
  const billingCycleStartDayAdjusted = Math.max(1, Math.min(31, billingCycleStartDay))

  // Adjust billingCycleStartDay if it's greater than the number of days in the current month
  // for instance february 31st is not a valid date and should be set to 28th
  const daysInCurrentMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate()
  const adjustedBillingCycleStartDay = Math.min(billingCycleStartDayAdjusted, daysInCurrentMonth)

  // set the start date to the adjusted billing cycle start day
  let cycleStart = setDate(currentDate, adjustedBillingCycleStartDay)
  // set the start date to the start of the day
  cycleStart = startOfDay(cycleStart)

  // if the current date is before the adjusted billing cycle start day, we need to set the cycle start to the previous month
  // meaning the billing cycle started in the previous month
  if (currentDate.getDate() < adjustedBillingCycleStartDay) {
    cycleStart = addMonths(cycleStart, -1)
  }

  // calculate the end of the billing cycle which have to consider the end of the day
  let cycleEnd = addMonths(cycleStart, 1)
  cycleEnd = endOfDay(setDate(cycleEnd, adjustedBillingCycleStartDay - 1))

  return { cycleStart, cycleEnd }
}

function calculateYearlyBillingCycle(
  currentDate: Date,
  billingCycleStartMonth: number
): {
  cycleStart: Date
  cycleEnd: Date
} {
  // Ensure billingCycleStartMonth is within valid range (1-12)
  const billingCycleStartMonthAdjusted = Math.max(1, Math.min(12, billingCycleStartMonth)) - 1 // Adjust for 0-based month

  // Calculate the start of the current billing cycle
  // this is the first day of the month
  let cycleStart = setMonth(startOfMonth(currentDate), billingCycleStartMonthAdjusted)
  cycleStart = startOfDay(cycleStart)

  // If the current date is before the billing cycle start month of the current year,
  // set the cycle start to the previous year
  // meaning the billing cycle started in the previous year
  if (
    currentDate < cycleStart ||
    (currentDate.getMonth() === billingCycleStartMonthAdjusted && currentDate.getDate() === 1)
  ) {
    cycleStart = addYears(cycleStart, -1)
  }

  // calculate the end of the billing cycle which have to consider the end of the day
  let cycleEnd = addYears(cycleStart, 1)
  cycleEnd = endOfDay(setDate(cycleEnd, 1))
  cycleEnd = endOfDay(addMonths(cycleEnd, -1))

  return { cycleStart, cycleEnd }
}
