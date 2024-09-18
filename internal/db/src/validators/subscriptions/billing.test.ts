import { differenceInSeconds } from "date-fns"
import { describe, expect, it } from "vitest"
import { configureBillingCycleSubscription } from "./billing"

const utcDate = (dateString: string, time = "00:00:00") => new Date(`${dateString}T${time}Z`)

// const consoleLogSpy = vi.spyOn(console, "info")

describe("configureBillingCycleSubscription", () => {
  it("should configure monthly billing cycle correctly", () => {
    const startDate = utcDate("2024-01-01")

    const result = configureBillingCycleSubscription({
      currentCycleStartAt: startDate.getTime(),
      trialDays: 0,
      billingCycleStart: 1,
      billingPeriod: "month",
    })

    expect(result.cycleStart).toEqual(utcDate("2024-01-01"))
    expect(result.cycleEnd).toEqual(utcDate("2024-01-31", "23:59:59.999"))
    expect(result.secondsInCycle).toBe(31 * 24 * 60 * 60)
    expect(result.prorationFactor).toBe(1)
    expect(result.billableSeconds).toBe(31 * 24 * 60 * 60)
    expect(result.trialDaysEndAt).toEqual(undefined)

    // // Optional: Print all console.log outputs
    // consoleLogSpy.mock.calls.forEach((call) => {
    //   console.info("Logged:", call[0])
    // })

    // // Restore console.log
    // consoleLogSpy.mockRestore()
  })

  it("should handle past billing cycles", () => {
    const startDate = utcDate("2024-02-15")
    const result = configureBillingCycleSubscription({
      currentCycleStartAt: startDate.getTime(),
      trialDays: 0,
      billingCycleStart: 1,
      billingPeriod: "month",
    })

    expect(result.trialDaysEndAt).toEqual(undefined)
    expect(result.cycleStart).toEqual(utcDate("2024-02-15"))
    expect(result.cycleEnd).toEqual(utcDate("2024-02-29", "23:59:59.999"))
    expect(result.prorationFactor).toBeGreaterThanOrEqual(0.5)
    // 15 days from 15th to 29th
    expect(result.billableSeconds).toBe(15 * 24 * 60 * 60)
  })

  it("should handle future billing cycles", () => {
    const startDate = utcDate("2024-02-01")
    const result = configureBillingCycleSubscription({
      currentCycleStartAt: startDate.getTime(),
      trialDays: 0,
      // billing cycle start is 7th
      billingCycleStart: 7,
      billingPeriod: "month",
    })

    expect(result.trialDaysEndAt).toEqual(undefined)
    expect(result.cycleStart).toEqual(utcDate("2024-02-01"))
    expect(result.cycleEnd).toEqual(utcDate("2024-02-06", "23:59:59.999"))
    expect(result.prorationFactor).toBeLessThanOrEqual(0.2)
    // 6 days from 1st to 6th
    expect(result.billableSeconds).toBe(6 * 24 * 60 * 60)
  })

  it("should handle end of the month billing cycle", () => {
    const startDate = utcDate("2024-02-01", "12:00:00")
    const result = configureBillingCycleSubscription({
      currentCycleStartAt: startDate.getTime(),
      trialDays: 0,
      // feb 31st doesn't exist, so it should be the last day of the month
      billingCycleStart: 31,
      billingPeriod: "month",
    })

    const billingSeconds =
      differenceInSeconds(utcDate("2024-02-28", "23:59:59.999").getTime(), startDate) + 1
    const secondsInCycle =
      differenceInSeconds(
        utcDate("2024-02-28", "23:59:59.999").getTime(),
        utcDate("2024-01-31", "00:00:00.000").getTime()
      ) + 1

    expect(result.trialDaysEndAt).toEqual(undefined)
    expect(result.cycleStart).toEqual(utcDate("2024-02-01", "12:00:00"))
    expect(result.cycleEnd).toEqual(utcDate("2024-02-28", "23:59:59.999"))
    expect(result.secondsInCycle).toBe(secondsInCycle)
    // from 31st to 28th is 28 days
    expect(result.prorationFactor).toBe(billingSeconds / secondsInCycle)
    expect(result.billableSeconds).toBe(billingSeconds)
  })

  it("should handle end of the month billing cycle for leap year", () => {
    const startDate = utcDate("2024-03-01", "12:00:00")
    const result = configureBillingCycleSubscription({
      currentCycleStartAt: startDate.getTime(),
      trialDays: 0,
      // feb 31st doesn't exist, so it should be the last day of the month
      billingCycleStart: 31,
      billingPeriod: "month",
    })

    const billingSeconds =
      differenceInSeconds(utcDate("2024-03-30", "23:59:59.999").getTime(), startDate) + 1
    const secondsInCycle =
      differenceInSeconds(
        utcDate("2024-03-30", "23:59:59.999").getTime(),
        utcDate("2024-02-29", "00:00:00").getTime()
      ) + 1

    expect(result.trialDaysEndAt).toEqual(undefined)
    expect(result.cycleStart).toEqual(utcDate("2024-03-01", "12:00:00"))
    expect(result.cycleEnd).toEqual(utcDate("2024-03-30", "23:59:59.999"))
    expect(result.secondsInCycle).toBe(secondsInCycle)
    // from 29th feb to 31th of march
    expect(result.prorationFactor).toBe(billingSeconds / secondsInCycle)
    expect(result.billableSeconds).toBe(billingSeconds)
  })

  it("should handle mid billing cycle", () => {
    const startDate = utcDate("2024-01-13", "12:00:00")

    const result = configureBillingCycleSubscription({
      currentCycleStartAt: startDate.getTime(),
      billingCycleStart: 1,
      billingPeriod: "month",
    })

    const secondsInCycle =
      differenceInSeconds(
        utcDate("2024-01-31", "23:59:59.999").getTime(),
        utcDate("2024-01-01", "00:00:00").getTime()
      ) + 1

    const billingSeconds =
      differenceInSeconds(utcDate("2024-01-31", "23:59:59.999").getTime(), startDate) + 1

    expect(result.trialDaysEndAt).toEqual(undefined)
    expect(result.cycleStart).toEqual(utcDate("2024-01-13", "12:00:00"))
    expect(result.cycleEnd).toEqual(utcDate("2024-01-31", "23:59:59.999"))
    expect(result.secondsInCycle).toBe(secondsInCycle)
    // from 20th to 31st is almost 1/3 of the way through the cycle
    expect(result.prorationFactor).toBe(billingSeconds / secondsInCycle)
    expect(result.billableSeconds).toBe(billingSeconds)
  })

  it("should handle end date before end cycle with trial days", () => {
    const startDate = utcDate("2024-01-05", "12:00:00")
    const endDate = utcDate("2024-01-09", "21:52:00")

    const result = configureBillingCycleSubscription({
      currentCycleStartAt: startDate.getTime(),
      trialDays: 5,
      billingCycleStart: 1,
      billingPeriod: "month",
      endAt: endDate.getTime(),
    })

    const secondsInCycle = differenceInSeconds(endDate, startDate)

    expect(result.trialDaysEndAt).toEqual(utcDate("2024-01-10", "12:00:00"))
    expect(result.cycleStart).toEqual(utcDate("2024-01-05", "12:00:00"))
    expect(result.cycleEnd).toEqual(endDate)
    expect(result.prorationFactor).toBeLessThan(1)
    expect(result.secondsInCycle).toBe(secondsInCycle)
    expect(result.billableSeconds).toBe(0)

    // Optional: Print all console.log outputs
    // consoleLogSpy.mock.calls.forEach((call) => {
    //   console.info("Logged:", call[0])
    // })
  })

  it("should handle trial period correctly", () => {
    const startDate = utcDate("2024-01-01")

    const result = configureBillingCycleSubscription({
      currentCycleStartAt: startDate.getTime(),
      trialDays: 15,
      billingCycleStart: 1,
      billingPeriod: "month",
    })

    expect(result.trialDaysEndAt).toEqual(utcDate("2024-01-16"))
    expect(result.cycleStart).toEqual(utcDate("2024-01-01", "00:00:00"))
    // end of the cycle is the trial days end date
    expect(result.cycleEnd).toEqual(utcDate("2024-01-16", "00:00:00"))
    expect(result.prorationFactor).toBe(0)
    expect(result.billableSeconds).toBe(0)
  })

  it("should handle leap year billing cycle", () => {
    const startDate = utcDate("2024-01-01")

    const result = configureBillingCycleSubscription({
      currentCycleStartAt: startDate.getTime(),
      trialDays: 0,
      billingCycleStart: 1, // January
      billingPeriod: "year",
    })

    expect(result.cycleStart).toEqual(utcDate("2024-01-01"))
    expect(result.cycleEnd).toEqual(utcDate("2024-12-31", "23:59:59.999"))
    expect(result.secondsInCycle).toBe(366 * 24 * 60 * 60) // 2024 is a leap year
    expect(result.billableSeconds).toBe(366 * 24 * 60 * 60)
    expect(result.prorationFactor).toBe((366 * 24 * 60 * 60) / (366 * 24 * 60 * 60))
  })

  it("should handle full yearly billing cycle", () => {
    const startDate = utcDate("2023-02-01")

    const result = configureBillingCycleSubscription({
      currentCycleStartAt: startDate.getTime(),
      trialDays: 0,
      billingCycleStart: 2, // February
      billingPeriod: "year",
    })

    expect(result.cycleStart).toEqual(utcDate("2023-02-01"))
    expect(result.cycleEnd).toEqual(utcDate("2024-01-31", "23:59:59.999"))
    expect(result.secondsInCycle).toBe(365 * 24 * 60 * 60)
    expect(result.billableSeconds).toBe(365 * 24 * 60 * 60)
    expect(result.prorationFactor).toBe((365 * 24 * 60 * 60) / (365 * 24 * 60 * 60))
  })

  it("should handle mid yearly billing cycle", () => {
    const startDate = utcDate("2023-01-01")

    const result = configureBillingCycleSubscription({
      currentCycleStartAt: startDate.getTime(),
      trialDays: 0,
      billingCycleStart: 2, // February
      billingPeriod: "year",
    })

    expect(result.cycleStart).toEqual(utcDate("2023-01-01"))
    expect(result.cycleEnd).toEqual(utcDate("2023-01-31", "23:59:59.999"))
    expect(result.secondsInCycle).toBe(365 * 24 * 60 * 60)
    expect(result.billableSeconds).toBe(31 * 24 * 60 * 60)
    expect(result.prorationFactor).toBe((31 * 24 * 60 * 60) / (365 * 24 * 60 * 60))
  })

  it("should handle yearly billing cycle with trial period", () => {
    const startDate = utcDate("2024-06-01", "12:00:00")

    const result = configureBillingCycleSubscription({
      currentCycleStartAt: startDate.getTime(),
      trialDays: 45,
      billingCycleStart: 1, // January
      billingPeriod: "year",
    })

    const secondsInCycle = differenceInSeconds(utcDate("2024-07-16", "12:00:00"), startDate)

    expect(result.cycleStart).toEqual(utcDate("2024-06-01", "12:00:00"))
    expect(result.cycleEnd).toEqual(utcDate("2024-07-16", "12:00:00"))
    expect(result.secondsInCycle).toBe(secondsInCycle) // 2024 is a leap year
    expect(result.prorationFactor).toBe(0)
    expect(result.billableSeconds).toBe(0)
    expect(result.trialDaysEndAt).toEqual(utcDate("2024-07-16", "12:00:00"))
  })

  it("should handle end date longer than billing cycle for yearly billing cycle", () => {
    const startDate = utcDate("2024-01-01")

    const endDate = utcDate("2025-03-15")
    const result = configureBillingCycleSubscription({
      currentCycleStartAt: startDate.getTime(),
      trialDays: 0,
      billingCycleStart: 1,
      billingPeriod: "year",
      endAt: endDate.getTime(),
    })

    const secondsInCycle =
      differenceInSeconds(utcDate("2024-12-31", "23:59:59.999"), utcDate("2024-01-01")) + 1
    const billingSeconds = differenceInSeconds(utcDate("2024-12-31", "23:59:59.999"), startDate) + 1

    expect(result.cycleStart).toEqual(utcDate("2024-01-01"))
    expect(result.cycleEnd).toEqual(utcDate("2024-12-31", "23:59:59.999"))
    // jan 1 to dec 31 is 12 months
    expect(result.billableSeconds).toBe(billingSeconds)
    expect(result.prorationFactor).toBe(billingSeconds / secondsInCycle)
  })

  it("should handle trial period longer than billing cycle for monthly billing cycle", () => {
    const startDate = utcDate("2024-01-01")
    const result = configureBillingCycleSubscription({
      currentCycleStartAt: startDate.getTime(),
      trialDays: 45,
      billingCycleStart: 1,
      billingPeriod: "month",
    })

    expect(result.trialDaysEndAt).toEqual(utcDate("2024-02-15"))
    expect(result.cycleStart).toEqual(startDate)
    expect(result.cycleEnd).toEqual(utcDate("2024-02-15"))
    expect(result.prorationFactor).toBe(0)
    expect(result.billableSeconds).toBe(0)
  })

  it("should handle trial period longer than billing cycle for yearly billing cycle", () => {
    const startDate = utcDate("2024-01-01", "12:00:00")
    const result = configureBillingCycleSubscription({
      currentCycleStartAt: startDate.getTime(),
      trialDays: 600,
      billingCycleStart: 1,
      billingPeriod: "year",
    })

    // 600 days is 1 year and 240 days - from jan 1 2024 to aug 23 2025
    expect(result.trialDaysEndAt).toEqual(utcDate("2025-08-23", "12:00:00"))
    expect(result.cycleStart).toEqual(startDate)
    expect(result.cycleEnd).toEqual(utcDate("2025-08-23", "12:00:00"))
    expect(result.prorationFactor).toBe(0)
    expect(result.billableSeconds).toBe(0)
  })
})
