import { differenceInSeconds } from "date-fns"
import { describe, expect, it } from "vitest"
import { configureBillingCycleSubscription } from "./billing"

const utcDate = (dateString: string, time = "00:00:00") => new Date(`${dateString}T${time}Z`)

// const consoleLogSpy = vi.spyOn(console, "info")

describe("configureBillingCycleSubscription", () => {
  it("should configure monthly billing cycle correctly", () => {
    const startDate = utcDate("2024-01-01")
    const currentDate = utcDate("2024-01-01")

    const result = configureBillingCycleSubscription({
      currentDate: currentDate.getTime(),
      billingCycleStartAt: startDate.getTime(),
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
    const startDate = utcDate("2024-01-01")
    const currentDate = utcDate("2024-02-01")
    const result = configureBillingCycleSubscription({
      currentDate: currentDate.getTime(),
      billingCycleStartAt: startDate.getTime(),
      trialDays: 0,
      billingCycleStart: 1,
      billingPeriod: "month",
    })

    expect(result.trialDaysEndAt).toEqual(undefined)
    expect(result.cycleStart).toEqual(utcDate("2024-02-01"))
    expect(result.cycleEnd).toEqual(utcDate("2024-02-29", "23:59:59.999"))
    expect(result.prorationFactor).toBe(1)
    // 29 days in february 2024
    expect(result.billableSeconds).toBe(29 * 24 * 60 * 60)
  })

  it("should handle mid billing cycle", () => {
    const startDate = utcDate("2024-01-13", "12:00:00")
    const currentDate = utcDate("2024-01-15", "12:00:00")
    const result = configureBillingCycleSubscription({
      currentDate: currentDate.getTime(),
      billingCycleStartAt: startDate.getTime(),
      billingCycleStart: 1,
      billingPeriod: "month",
    })

    expect(result.trialDaysEndAt).toEqual(undefined)
    expect(result.cycleStart).toEqual(utcDate("2024-01-01"))
    expect(result.cycleEnd).toEqual(utcDate("2024-01-31", "23:59:59.999"))
    // from 20th to 31st is almost 1/3 of the way through the cycle
    expect(result.prorationFactor).toBeGreaterThanOrEqual(1 / 3)
  })

  it("should handle end date before end cycle with trial days", () => {
    const startDate = utcDate("2024-01-05", "12:00:00")
    const currentDate = utcDate("2024-01-10")
    const endDate = utcDate("2024-01-09", "21:52:00")

    const result = configureBillingCycleSubscription({
      currentDate: currentDate.getTime(),
      billingCycleStartAt: startDate.getTime(),
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

  it("should handle change date before end cycle with trial days", () => {
    const startDate = utcDate("2024-01-05", "12:00:00")
    const currentDate = utcDate("2024-01-10")
    const changeDate = utcDate("2024-01-08", "12:07:00")

    const result = configureBillingCycleSubscription({
      currentDate: currentDate.getTime(),
      billingCycleStartAt: startDate.getTime(),
      trialDays: 5,
      billingCycleStart: 1,
      billingPeriod: "month",
      changeAt: changeDate.getTime(),
    })

    const secondsInCycle = differenceInSeconds(changeDate, startDate)

    expect(result.trialDaysEndAt).toEqual(utcDate("2024-01-10", "12:00:00"))
    expect(result.cycleStart).toEqual(utcDate("2024-01-05", "12:00:00"))
    expect(result.cycleEnd).toEqual(changeDate)
    expect(result.prorationFactor).toBeLessThan(1)
    expect(result.secondsInCycle).toBe(secondsInCycle)
    expect(result.billableSeconds).toBe(0)
  })

  it("should handle cancel date before end cycle with trial days", () => {
    const startDate = utcDate("2024-01-05", "12:00:00")
    const currentDate = utcDate("2024-01-10")
    const cancelDate = utcDate("2024-01-08", "12:07:00")

    const result = configureBillingCycleSubscription({
      currentDate: currentDate.getTime(),
      billingCycleStartAt: startDate.getTime(),
      trialDays: 5,
      billingCycleStart: 1,
      billingPeriod: "month",
      cancelAt: cancelDate.getTime(),
    })

    const secondsInCycle = differenceInSeconds(cancelDate, startDate)

    expect(result.trialDaysEndAt).toEqual(utcDate("2024-01-10", "12:00:00"))
    expect(result.cycleStart).toEqual(utcDate("2024-01-05", "12:00:00"))
    expect(result.cycleEnd).toEqual(cancelDate)
    expect(result.prorationFactor).toBeLessThan(1)
    expect(result.secondsInCycle).toBe(secondsInCycle)
    expect(result.billableSeconds).toBe(0)
  })

  it("should handle min date between end/cancel/change before end cycle with trial days", () => {
    const startDate = utcDate("2024-01-05", "12:00:00")
    const currentDate = utcDate("2024-01-10")
    const cancelDate = utcDate("2024-01-25", "12:00:00")
    const endDate = utcDate("2024-01-20", "21:52:00")
    const changeDate = utcDate("2024-01-25", "14:00:00")

    const result = configureBillingCycleSubscription({
      currentDate: currentDate.getTime(),
      billingCycleStartAt: startDate.getTime(),
      trialDays: 20,
      billingCycleStart: 1,
      billingPeriod: "month",
      cancelAt: cancelDate.getTime(),
      endAt: endDate.getTime(),
      changeAt: changeDate.getTime(),
    })

    const secondsInCycle = differenceInSeconds(endDate, startDate)

    expect(result.trialDaysEndAt).toEqual(utcDate("2024-01-25", "12:00:00"))
    expect(result.cycleStart).toEqual(utcDate("2024-01-05", "12:00:00"))
    expect(result.cycleEnd).toEqual(endDate)
    expect(result.prorationFactor).toBeLessThan(1)
    expect(result.secondsInCycle).toBe(secondsInCycle)
    expect(result.billableSeconds).toBe(0)
  })

  it("should handle trial period correctly", () => {
    const startDate = utcDate("2024-01-01")
    const currentDate = utcDate("2024-01-01")

    const result = configureBillingCycleSubscription({
      currentDate: currentDate.getTime(),
      billingCycleStartAt: startDate.getTime(),
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

    // // Optional: Print all console.log outputs
    // consoleLogSpy.mock.calls.forEach((call) => {
    //   console.info("Logged:", call[0])
    // })

    // // Restore console.log
    // consoleLogSpy.mockRestore()
  })

  it("should handle yearly billing cycle", () => {
    const startDate = utcDate("2024-01-01")
    const currentDate = utcDate("2024-06-01")

    const result = configureBillingCycleSubscription({
      currentDate: currentDate.getTime(),
      billingCycleStartAt: startDate.getTime(),
      trialDays: 0,
      billingCycleStart: 1, // January
      billingPeriod: "year",
    })

    expect(result.cycleStart).toEqual(utcDate("2024-01-01"))
    expect(result.cycleEnd).toEqual(utcDate("2024-12-31", "23:59:59.999"))
    expect(result.secondsInCycle).toBe(366 * 24 * 60 * 60) // 2024 is a leap year

    // // Optional: Print all console.log outputs
    // consoleLogSpy.mock.calls.forEach((call) => {
    //   console.info("Logged:", call[0])
    // })

    // // Restore console.log
    // consoleLogSpy.mockRestore()
  })

  it("should handle yearly billing cycle with trial period", () => {
    const startDate = utcDate("2024-06-01", "12:00:00")
    const currentDate = utcDate("2024-06-15")

    const result = configureBillingCycleSubscription({
      currentDate: currentDate.getTime(),
      billingCycleStartAt: startDate.getTime(),
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

    // // Optional: Print all console.log outputs
    // consoleLogSpy.mock.calls.forEach((call) => {
    //   console.info("Logged:", call[0])
    // })

    // // Restore console.log
    // consoleLogSpy.mockRestore()
  })

  it("should handle end date longer than billing cycle", () => {
    const startDate = utcDate("2024-01-01")
    const currentDate = utcDate("2024-01-01")
    const endDate = utcDate("2024-03-15")
    const result = configureBillingCycleSubscription({
      currentDate: currentDate.getTime(),
      billingCycleStartAt: startDate.getTime(),
      trialDays: 0,
      billingCycleStart: 1,
      billingPeriod: "month",
      endAt: endDate.getTime(),
    })

    expect(result.cycleEnd).toEqual(utcDate("2024-01-31", "23:59:59.999"))
  })

  it("should handle trial period longer than billing cycle", () => {
    const startDate = utcDate("2024-01-01")
    const currentDate = utcDate("2024-02-01")
    const result = configureBillingCycleSubscription({
      currentDate: currentDate.getTime(),
      billingCycleStartAt: startDate.getTime(),
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
})
