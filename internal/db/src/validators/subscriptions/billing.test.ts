import { describe, expect, it } from "vitest"
import { configureBillingCycleSubscription } from "./billing"

const utcDate = (dateString: string, time = "00:00:00") => new Date(`${dateString}T${time}Z`)

// const consoleLogSpy = vi.spyOn(console, "info")

describe("configureBillingCycleSubscription", () => {
  it("should configure monthly billing cycle correctly", () => {
    const startDate = utcDate("2024-01-01")
    const currentDate = utcDate("2024-01-01")

    const result = configureBillingCycleSubscription({
      currentDate,
      startDate,
      trialDays: 0,
      billingCycleStart: 1,
      billingPeriod: "month",
    })

    expect(result.cycleStart).toEqual(utcDate("2024-01-01"))
    expect(result.cycleEnd).toEqual(utcDate("2024-01-31", "23:59:59.999"))
    expect(result.secondsInCycle).toBe(31 * 24 * 60 * 60)
    expect(result.prorationFactor).toBe(1)
    expect(result.billableSeconds).toBe(31 * 24 * 60 * 60)
    expect(result.effectiveStartDate).toEqual(utcDate("2024-01-01"))
    expect(result.nextBillingAt).toEqual(utcDate("2024-01-31", "23:59:59.999"))
    expect(result.trialDaysEndAt).toEqual(undefined)

    // // Optional: Print all console.log outputs
    // consoleLogSpy.mock.calls.forEach((call) => {
    //   console.info("Logged:", call[0])
    // })

    // // Restore console.log
    // consoleLogSpy.mockRestore()
  })

  it("should handle end date before end cycle with trial days", () => {
    const startDate = utcDate("2024-01-05", "12:00:00")
    const currentDate = utcDate("2024-01-10")
    const endDate = utcDate("2024-01-20", "21:52:00")

    const result = configureBillingCycleSubscription({
      currentDate,
      startDate,
      trialDays: 5,
      billingCycleStart: 1,
      billingPeriod: "month",
      endDate,
    })

    expect(result.trialDaysEndAt).toEqual(utcDate("2024-01-10", "12:00:00"))
    expect(result.effectiveStartDate).toEqual(utcDate("2024-01-10", "12:00:00"))
    expect(result.effectiveEndDate).toEqual(endDate)
    expect(result.cycleStart).toEqual(utcDate("2024-01-01"))
    expect(result.cycleEnd).toEqual(utcDate("2024-01-31", "23:59:59.999"))
    expect(result.prorationFactor).toBeLessThan(1)
    expect(result.nextBillingAt).toEqual(endDate)
  })

  it("should handle trial period correctly", () => {
    const startDate = utcDate("2024-01-01")
    const currentDate = utcDate("2024-01-01")

    const result = configureBillingCycleSubscription({
      currentDate,
      startDate,
      trialDays: 15,
      billingCycleStart: 1,
      billingPeriod: "month",
    })

    expect(result.trialDaysEndAt).toEqual(utcDate("2024-01-16"))
    expect(result.effectiveStartDate).toEqual(utcDate("2024-01-16"))
    expect(result.prorationFactor).toBeLessThan(1)

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
      currentDate,
      startDate,
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
      currentDate,
      startDate,
      trialDays: 45,
      billingCycleStart: 1, // January
      billingPeriod: "year",
      autoRenew: false,
    })

    expect(result.cycleStart).toEqual(utcDate("2024-01-01"))
    expect(result.cycleEnd).toEqual(utcDate("2024-12-31", "23:59:59.999"))
    expect(result.effectiveStartDate).toEqual(utcDate("2024-07-16", "12:00:00"))
    expect(result.effectiveEndDate).toEqual(utcDate("2024-12-31", "23:59:59.999"))
    expect(result.secondsInCycle).toBe(366 * 24 * 60 * 60) // 2024 is a leap year
    expect(result.prorationFactor).toBeCloseTo(0.46, 2)
    expect(result.trialDaysEndAt).toEqual(utcDate("2024-07-16", "12:00:00"))

    // // Optional: Print all console.log outputs
    // consoleLogSpy.mock.calls.forEach((call) => {
    //   console.info("Logged:", call[0])
    // })

    // // Restore console.log
    // consoleLogSpy.mockRestore()
  })

  it("should handle end date correctly", () => {
    const startDate = utcDate("2024-01-01")
    const currentDate = utcDate("2024-01-01")
    const endDate = utcDate("2024-03-15")
    const result = configureBillingCycleSubscription({
      currentDate,
      startDate,
      trialDays: 0,
      billingCycleStart: 1,
      billingPeriod: "month",
      endDate,
      autoRenew: false,
    })

    expect(result.effectiveEndDate).toEqual(utcDate("2024-03-15"))
    expect(result.nextBillingAt).toEqual(utcDate("2024-03-15"))
  })

  it("should handle trial period longer than billing cycle", () => {
    const startDate = utcDate("2024-01-01")
    const currentDate = utcDate("2024-02-01")
    const result = configureBillingCycleSubscription({
      currentDate,
      startDate,
      trialDays: 45,
      billingCycleStart: 1,
      billingPeriod: "month",
    })

    expect(result.trialDaysEndAt).toEqual(utcDate("2024-02-15"))
    expect(result.cycleStart).toEqual(utcDate("2024-02-01"))
    expect(result.cycleEnd).toEqual(utcDate("2024-02-29", "23:59:59.999"))
    expect(result.nextBillingAt).toEqual(utcDate("2024-02-29", "23:59:59.999"))
    expect(result.prorationFactor).toBeLessThan(1)
    expect(result.effectiveEndDate).toEqual(undefined)
  })

  it("should handle auto renew correctly", () => {
    const startDate = utcDate("2024-01-01")
    const currentDate = utcDate("2024-02-01")
    const result = configureBillingCycleSubscription({
      currentDate,
      startDate,
      trialDays: 45,
      billingCycleStart: 1,
      billingPeriod: "month",
      autoRenew: false,
    })

    expect(result.trialDaysEndAt).toEqual(utcDate("2024-02-15"))
    expect(result.cycleStart).toEqual(utcDate("2024-02-01"))
    expect(result.cycleEnd).toEqual(utcDate("2024-02-29", "23:59:59.999"))
    expect(result.nextBillingAt).toEqual(utcDate("2024-02-29", "23:59:59.999"))
    expect(result.prorationFactor).toBeLessThan(1)
    expect(result.effectiveEndDate).toEqual(utcDate("2024-02-29", "23:59:59.999"))
  })

  it("should handle mid billing cycle", () => {
    const startDate = utcDate("2024-01-13", "12:00:00")
    const currentDate = utcDate("2024-01-15", "12:00:00")
    const result = configureBillingCycleSubscription({
      currentDate,
      startDate,
      trialDays: 7,
      billingCycleStart: 1,
      billingPeriod: "month",
    })

    expect(result.trialDaysEndAt).toEqual(utcDate("2024-01-20", "12:00:00"))
    expect(result.cycleStart).toEqual(utcDate("2024-01-01"))
    expect(result.cycleEnd).toEqual(utcDate("2024-01-31", "23:59:59.999"))
    expect(result.nextBillingAt).toEqual(utcDate("2024-01-31", "23:59:59.999"))
    // from 20th to 31st is almost 1/3 of the way through the cycle
    expect(result.prorationFactor).toBeGreaterThanOrEqual(1 / 3)
    expect(result.effectiveEndDate).toEqual(undefined)
  })
})
