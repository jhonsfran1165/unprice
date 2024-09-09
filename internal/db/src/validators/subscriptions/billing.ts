import {
  addDays,
  addMonths,
  addYears,
  differenceInSeconds,
  endOfDay,
  endOfMonth,
  max,
  setDate,
  setMonth,
  startOfDay,
  startOfMonth,
} from "date-fns"
import { type BillingPeriod, convertDateToUTC } from "../shared"

// this function calculate the billing cycle for a subscription
// when trials are passed the subscription cycle will be the start date + trial days
export function configureBillingCycleSubscription({
  currentDate = Date.now(),
  trialDays = 0,
  billingCycleStartAt,
  billingCycleStart,
  billingPeriod,
  endAt,
  changeAt,
  cancelAt,
}: {
  currentDate?: number
  trialDays?: number
  billingCycleStartAt: number
  billingCycleStart: number
  billingPeriod: BillingPeriod
  endAt?: number
  changeAt?: number
  cancelAt?: number
}): {
  cycleStart: Date
  cycleEnd: Date
  secondsInCycle: number
  prorationFactor: number
  billableSeconds: number
  trialDaysEndAt?: Date
} {
  // calculate the min date different than 0
  const minDateEnd = [endAt, cancelAt, changeAt]
    .filter((date) => date && date > 0)
    .reduce((min, date) => (date && (!min || date < min) ? date : min), 0)

  if (trialDays > 0) {
    // calculate the trials, here we don't need to worry about the end of the day because
    // we are calculating the proration to the seconds, after the first cycle the billing will align with the start of the day
    const trialDaysEndAt = addDays(billingCycleStartAt, trialDays)
    // if there  are trial days, our first cycle would be when the trails starts and ends at the end of the trial days
    // in this part proration is zero

    // if the end date is less than the trial days end date, we need to use the end date
    const effectiveEndCycle =
      minDateEnd && minDateEnd > 0
        ? Math.min(trialDaysEndAt.getTime(), minDateEnd)
        : trialDaysEndAt.getTime()

    const secondsInCycle = differenceInSeconds(
      new Date(effectiveEndCycle),
      new Date(billingCycleStartAt)
    )

    return {
      cycleStart: new Date(billingCycleStartAt),
      cycleEnd: new Date(effectiveEndCycle),
      secondsInCycle,
      prorationFactor: 0,
      billableSeconds: 0,
      trialDaysEndAt: new Date(trialDaysEndAt),
    }
  }

  // given the current date, calculate the start and end of the current billing cycle
  const { cycleStart, cycleEnd } =
    billingPeriod === "month"
      ? calculateMonthlyBillingCycle(new Date(currentDate), billingCycleStart)
      : calculateYearlyBillingCycle(new Date(currentDate), billingCycleStart)

  // we want to keep fairness so we calculate the proration to the seconds
  // INFO: if you find some ways we can improve fairness along the whole project please give me a shout
  const effectiveStartDate = max([billingCycleStartAt, cycleStart]).getTime()
  // if end date is defined define the effective end date
  const effectiveEndDate = minDateEnd && minDateEnd > 0 ? minDateEnd : cycleEnd.getTime()

  // depending on the end date, we calculate the effective end cycle
  const effectiveEndCycle = effectiveEndDate ? effectiveEndDate : cycleEnd.getTime()
  const effectiveStartCycle = cycleStart.getTime()

  // The + 1 is added to include both the start and end dates in the calculation.
  // This ensures that a full day is counted even if the difference is calculated to the same time on consecutive days.
  const secondsInCycle = differenceInSeconds(effectiveEndCycle, effectiveStartCycle) + 1

  // Similarly, the + 1 here ensures that the last second of the billing period is included.
  // The Math.max ensures we don't get negative billable seconds if effectiveStartDate is after effectiveEndCycle.
  const billableSeconds = Math.max(
    0,
    differenceInSeconds(effectiveEndCycle, effectiveStartDate) + 1
  )

  // The prorationFactor is calculated using the adjusted billableSeconds and secondsInCycle
  const prorationFactor = billableSeconds / secondsInCycle

  return {
    cycleStart,
    cycleEnd,
    secondsInCycle,
    prorationFactor,
    billableSeconds,
  }
}

// TODO: handle errors
export function calculateBillingCycle({
  currentDate,
  startDate,
  billingCycleStart,
  billingPeriod,
}: {
  currentDate: Date
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
  const { cycleStart, cycleEnd } =
    billingPeriod === "month"
      ? calculateMonthlyBillingCycle(convertDateToUTC(currentDate), billingCycleStart)
      : calculateYearlyBillingCycle(convertDateToUTC(currentDate), billingCycleStart)

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

  return { cycleStart: convertDateToUTC(cycleStart), cycleEnd: convertDateToUTC(cycleEnd) }
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
  cycleEnd = setDate(cycleEnd, 1)
  cycleEnd = addMonths(cycleEnd, -1)
  cycleEnd = endOfMonth(cycleEnd)
  cycleEnd = endOfDay(cycleEnd)

  return { cycleStart: convertDateToUTC(cycleStart), cycleEnd: convertDateToUTC(cycleEnd) }
}
