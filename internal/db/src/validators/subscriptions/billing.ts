import {
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

// TODO: handle errors
export function calculateBillingCycle(
  startDate: Date,
  trialDaysEnd: Date | null,
  billingCycleStart: number,
  billingPeriod: BillingPeriod
): {
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
  const effectiveStartDate = max([startDate, cycleStart, trialDaysEnd || new Date(0)])
  const billableStart = startOfDay(effectiveStartDate)
  const effectiveEndDate = currentDate > cycleEnd ? cycleEnd : currentDate

  const secondsInCycle = differenceInSeconds(cycleEnd, cycleStart) + 1
  const billableSeconds = Math.max(0, differenceInSeconds(effectiveEndDate, billableStart) + 1)
  const prorationFactor = billableSeconds / secondsInCycle

  return {
    cycleStart,
    cycleEnd,
    secondsInCycle,
    prorationFactor,
    billableSeconds,
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
