import { differenceInSeconds } from "date-fns"
import { describe, expect, it } from "vitest"
import type { BillingPeriod } from "../shared"
import { configureBillingCycleSubscription } from "./billing"

const utcDate = (dateString: string, time = "00:00:00") =>
  new Date(`${dateString}T${time}Z`).getTime()

// const consoleLogSpy = vi.spyOn(console, "info")

describe("configureBillingCycleSubscription", () => {
  describe("one-time billing", () => {
    it("should handle one-time payment without trial", () => {
      const startMs = utcDate("2024-01-01", "12:00:00")

      const result = configureBillingCycleSubscription({
        currentCycleStartAt: startMs,
        trialDays: 0,
        billingCycleStart: 1,
        billingPeriod: "onetime",
      })

      expect(result.cycleStartMs).toEqual(startMs)
      expect(result.cycleEndMs).toEqual(startMs)
      expect(result.secondsInCycle).toBe(0)
      expect(result.prorationFactor).toBe(1)
      expect(result.billableSeconds).toBe(0)
      expect(result.isOneTime).toBe(true)
      expect(result.isTrialPeriod).toBe(false)
      expect(result.trialEndsAtMs).toBeUndefined()
    })

    it("should handle one-time payment with trial", () => {
      const startMs = utcDate("2024-01-01", "12:00:00")
      const trialDays = 14

      const result = configureBillingCycleSubscription({
        currentCycleStartAt: startMs,
        trialDays,
        billingCycleStart: 1,
        billingPeriod: "onetime",
      })

      const expectedTrialEndMs = utcDate("2024-01-15", "11:59:59.999")

      expect(result.cycleStartMs).toEqual(startMs)
      expect(result.cycleEndMs).toEqual(expectedTrialEndMs)
      expect(result.secondsInCycle).toBe(0)
      expect(result.prorationFactor).toBe(1)
      expect(result.billableSeconds).toBe(0)
      expect(result.isOneTime).toBe(true)
      expect(result.isTrialPeriod).toBe(true)
      expect(result.trialEndsAtMs).toEqual(expectedTrialEndMs)
    })
  })

  describe("recurring billing periods", () => {
    describe("monthly billing", () => {
      it("should handle start of month billing cycle", () => {
        const startMs = utcDate("2024-01-01", "12:00:00")

        const result = configureBillingCycleSubscription({
          currentCycleStartAt: startMs,
          billingCycleStart: 1,
          billingPeriod: "month",
        })

        expect(result.cycleStartMs).toEqual(startMs)
        expect(result.cycleEndMs).toEqual(utcDate("2024-01-31", "23:59:59.999"))
        expect(result.isOneTime).toBe(false)
        expect(result.isTrialPeriod).toBe(false)
      })

      it("should handle mid-month start with future anchor", () => {
        const startMs = utcDate("2024-01-05", "12:00:00")

        const result = configureBillingCycleSubscription({
          currentCycleStartAt: startMs,
          billingCycleStart: 15,
          billingPeriod: "month",
        })

        expect(result.cycleStartMs).toEqual(startMs)
        expect(result.cycleEndMs).toEqual(utcDate("2024-01-14", "23:59:59.999"))
      })

      it("should handle end of month edge cases in leap year", () => {
        const startMs = utcDate("2024-02-01", "12:00:00")

        const result = configureBillingCycleSubscription({
          currentCycleStartAt: startMs,
          billingCycleStart: 31,
          billingPeriod: "month",
        })

        expect(result.cycleStartMs).toEqual(startMs)
        expect(result.cycleEndMs).toEqual(utcDate("2024-02-29", "23:59:59.999"))
      })
    })

    describe("5-minute billing", () => {
      it("should handle exact 5-minute cycles", () => {
        const startMs = utcDate("2024-01-01", "12:00:00")

        const result = configureBillingCycleSubscription({
          currentCycleStartAt: startMs,
          billingCycleStart: 0,
          billingPeriod: "5m",
        })

        expect(result.cycleStartMs).toEqual(startMs)
        expect(result.cycleEndMs).toEqual(utcDate("2024-01-01", "12:04:59.999"))
        expect(result.secondsInCycle).toBe(5 * 60)
        expect(result.billableSeconds).toBe(5 * 60)
        expect(result.prorationFactor).toBe(1)
      })
    })
  })

  describe("trial periods", () => {
    it("should handle trial period with exact end time", () => {
      const startMs = utcDate("2024-01-01", "15:30:00")
      const trialDays = 7

      const result = configureBillingCycleSubscription({
        currentCycleStartAt: startMs,
        trialDays,
        billingCycleStart: 1,
        billingPeriod: "month",
      })

      const expectedTrialEndMs = utcDate("2024-01-08", "15:29:59.999")

      expect(result.cycleStartMs).toEqual(startMs)
      expect(result.cycleEndMs).toEqual(expectedTrialEndMs)
      expect(result.trialEndsAtMs).toEqual(expectedTrialEndMs)
      expect(result.prorationFactor).toBe(0)
      expect(result.billableSeconds).toBe(0)
      expect(result.isTrialPeriod).toBe(true)
    })

    it("should handle trial period with early end date", () => {
      const startMs = utcDate("2024-01-01", "12:00:00")
      const endMs = utcDate("2024-01-05", "12:00:00")

      const result = configureBillingCycleSubscription({
        currentCycleStartAt: startMs,
        trialDays: 7,
        billingCycleStart: 1,
        billingPeriod: "month",
        endAt: endMs,
      })

      expect(result.cycleStartMs).toEqual(startMs)
      expect(result.cycleEndMs).toEqual(endMs)
      expect(result.trialEndsAtMs).toEqual(utcDate("2024-01-08", "11:59:59.999"))
      expect(result.isTrialPeriod).toBe(true)
    })
  })

  describe("proration calculations", () => {
    it("should calculate correct proration for partial month", () => {
      const startMs = utcDate("2024-01-15", "12:00:00")

      const result = configureBillingCycleSubscription({
        currentCycleStartAt: startMs,
        billingCycleStart: 1,
        billingPeriod: "month",
      })

      expect(result.cycleStartMs).toEqual(startMs)
      expect(result.cycleEndMs).toEqual(utcDate("2024-01-31", "23:59:59.999"))

      const totalSeconds = differenceInSeconds(utcDate("2024-01-31", "23:59:59.999"), startMs) + 1
      const billableSeconds =
        differenceInSeconds(utcDate("2024-01-31", "23:59:59.999"), startMs) + 1

      expect(result.secondsInCycle).toBe(totalSeconds)
      expect(result.billableSeconds).toBe(billableSeconds)
      expect(result.prorationFactor).toBe(billableSeconds / totalSeconds)
    })
  })

  describe("error handling", () => {
    it("should throw error when start date is after end date", () => {
      const startMs = utcDate("2024-01-15")
      const endMs = utcDate("2024-01-01")

      expect(() =>
        configureBillingCycleSubscription({
          currentCycleStartAt: startMs,
          billingCycleStart: 1,
          billingPeriod: "month",
          endAt: endMs,
        })
      ).toThrow("Effective start date is after the effective end date")
    })

    it("should throw error for invalid billing period", () => {
      const startMs = utcDate("2024-01-01")

      expect(() =>
        configureBillingCycleSubscription({
          currentCycleStartAt: startMs,
          billingCycleStart: 1,
          billingPeriod: "invalid" as BillingPeriod,
        })
      ).toThrow("Invalid billing period")
    })
  })

  describe("yearly billing", () => {
    it("should handle start date in month before anchor month", () => {
      const startMs = utcDate("2024-02-15", "14:30:00")

      const result = configureBillingCycleSubscription({
        currentCycleStartAt: startMs,
        billingCycleStart: 3, // March
        billingPeriod: "year",
      })

      expect(result.cycleStartMs).toEqual(startMs)
      expect(result.cycleEndMs).toEqual(utcDate("2024-02-29", "23:59:59.999"))
    })

    it("should handle start date in anchor month", () => {
      const startMs = utcDate("2024-03-15", "14:30:00")

      const result = configureBillingCycleSubscription({
        currentCycleStartAt: startMs,
        billingCycleStart: 3, // March
        billingPeriod: "year",
      })

      expect(result.cycleStartMs).toEqual(startMs)
      expect(result.cycleEndMs).toEqual(utcDate("2025-02-28", "23:59:59.999"))
    })

    it("should handle start date after anchor month", () => {
      const startMs = utcDate("2024-04-15", "14:30:00")

      const result = configureBillingCycleSubscription({
        currentCycleStartAt: startMs,
        billingCycleStart: 3, // March
        billingPeriod: "year",
      })

      expect(result.cycleStartMs).toEqual(startMs)
      expect(result.cycleEndMs).toEqual(utcDate("2025-02-28", "23:59:59.999"))
    })
  })

  describe("monthly billing edge cases", () => {
    it("should handle month transitions with 31 days to 30 days", () => {
      const startMs = utcDate("2024-01-31", "14:30:00")

      const result = configureBillingCycleSubscription({
        currentCycleStartAt: startMs,
        billingCycleStart: 31,
        billingPeriod: "month",
      })

      expect(result.cycleStartMs).toEqual(startMs)
      expect(result.cycleEndMs).toEqual(utcDate("2024-02-29", "23:59:59.999"))
    })

    it("should handle month transitions with 30 days to 31 days", () => {
      const startMs = utcDate("2024-04-30", "14:30:00")

      const result = configureBillingCycleSubscription({
        currentCycleStartAt: startMs,
        billingCycleStart: 30,
        billingPeriod: "month",
      })

      expect(result.cycleStartMs).toEqual(startMs)
      expect(result.cycleEndMs).toEqual(utcDate("2024-05-31", "23:59:59.999"))
    })

    it("should handle start date on last day of month", () => {
      const startMs = utcDate("2024-02-29", "14:30:00")

      const result = configureBillingCycleSubscription({
        currentCycleStartAt: startMs,
        billingCycleStart: 31,
        billingPeriod: "month",
      })

      expect(result.cycleStartMs).toEqual(startMs)
      expect(result.cycleEndMs).toEqual(utcDate("2024-03-31", "23:59:59.999"))
    })
  })

  describe("trial period edge cases", () => {
    it("should handle trial ending on month boundary", () => {
      const startMs = utcDate("2024-01-15", "00:00:00")

      const result = configureBillingCycleSubscription({
        currentCycleStartAt: startMs,
        trialDays: 17, // Trial ends Feb 1st
        billingCycleStart: 1,
        billingPeriod: "month",
      })

      expect(result.cycleStartMs).toEqual(startMs)
      expect(result.cycleEndMs).toEqual(utcDate("2024-01-31", "23:59:59.999"))
      expect(result.trialEndsAtMs).toEqual(utcDate("2024-01-31", "23:59:59.999"))
    })

    it("should handle trial with early end date before trial end", () => {
      const startMs = utcDate("2024-01-01", "00:00:00")
      const endMs = utcDate("2024-01-07", "00:00:00")

      const result = configureBillingCycleSubscription({
        currentCycleStartAt: startMs,
        trialDays: 14,
        billingCycleStart: 1,
        billingPeriod: "month",
        endAt: endMs,
      })

      expect(result.cycleStartMs).toEqual(startMs)
      expect(result.cycleEndMs).toEqual(endMs)
      expect(result.trialEndsAtMs).toEqual(utcDate("2024-01-14", "23:59:59.999"))
      expect(result.isTrialPeriod).toBe(true)
    })
  })
})

describe("billing cycle anchor handling", () => {
  it("should handle subscription start before anchor in same month", () => {
    const startMs = utcDate("2024-01-05", "14:30:00")

    const result = configureBillingCycleSubscription({
      currentCycleStartAt: startMs,
      trialDays: 0,
      billingCycleStart: 15, // Anchor on 15th
      billingPeriod: "month",
    })

    // First period should be partial - from start to just before anchor
    expect(result.cycleStartMs).toEqual(startMs)
    expect(result.cycleEndMs).toEqual(utcDate("2024-01-14", "23:59:59.999"))

    const fullCycleSeconds =
      differenceInSeconds(
        utcDate("2024-01-14", "23:59:59.999"),
        utcDate("2024-01-05", "14:30:00")
      ) + 1

    const billableSeconds = differenceInSeconds(utcDate("2024-01-14", "23:59:59.999"), startMs) + 1

    expect(result.secondsInCycle).toBe(fullCycleSeconds)
    expect(result.billableSeconds).toBe(billableSeconds)
    expect(result.prorationFactor).toBe(billableSeconds / fullCycleSeconds)
  })

  it("should handle subscription start after anchor requiring next month alignment", () => {
    const startMs = utcDate("2024-01-20", "14:30:00")

    const result = configureBillingCycleSubscription({
      currentCycleStartAt: startMs,
      trialDays: 0,
      billingCycleStart: 15, // Anchor on 15th
      billingPeriod: "month",
    })

    // First period should be partial - from start to next anchor
    expect(result.cycleStartMs).toEqual(startMs)
    expect(result.cycleEndMs).toEqual(utcDate("2024-02-14", "23:59:59.999"))

    const fullCycleSeconds =
      differenceInSeconds(
        utcDate("2024-02-14", "23:59:59.999"),
        utcDate("2024-01-20", "14:30:00")
      ) + 1

    const billableSeconds = differenceInSeconds(utcDate("2024-02-14", "23:59:59.999"), startMs) + 1

    expect(result.secondsInCycle).toBe(fullCycleSeconds)
    expect(result.billableSeconds).toBe(billableSeconds)
    expect(result.prorationFactor).toBe(billableSeconds / fullCycleSeconds)
  })

  it("should handle subscription start exactly on anchor", () => {
    const startMs = utcDate("2024-01-15", "00:00:00")

    const result = configureBillingCycleSubscription({
      currentCycleStartAt: startMs,
      trialDays: 0,
      billingCycleStart: 15, // Anchor on 15th
      billingPeriod: "month",
    })

    // Should start a full period from the anchor
    expect(result.cycleStartMs).toEqual(startMs)
    expect(result.cycleEndMs).toEqual(utcDate("2024-02-14", "23:59:59.999"))

    const secondsInCycle = differenceInSeconds(utcDate("2024-02-14", "23:59:59.999"), startMs) + 1

    expect(result.secondsInCycle).toBe(secondsInCycle)
    expect(result.billableSeconds).toBe(secondsInCycle)
    expect(result.prorationFactor).toBe(1)
  })

  it("should handle yearly billing with month anchor", () => {
    const startMs = utcDate("2024-02-15", "14:30:00")

    const result = configureBillingCycleSubscription({
      currentCycleStartAt: startMs,
      trialDays: 0,
      billingCycleStart: 3, // Anchor on March
      billingPeriod: "year",
    })

    // First period should be partial - from start to just before next anchor
    expect(result.cycleStartMs).toEqual(startMs)
    expect(result.cycleEndMs).toEqual(utcDate("2024-02-29", "23:59:59.999"))

    const fullCycleSeconds =
      differenceInSeconds(
        utcDate("2024-02-29", "23:59:59.999"),
        utcDate("2024-02-15", "14:30:00")
      ) + 1

    const billableSeconds = differenceInSeconds(utcDate("2024-02-29", "23:59:59.999"), startMs) + 1

    expect(result.secondsInCycle).toBe(fullCycleSeconds)
    expect(result.billableSeconds).toBe(billableSeconds)
    expect(result.prorationFactor).toBe(billableSeconds / fullCycleSeconds)
  })

  it("should handle trial period with anchor alignment", () => {
    const startMs = utcDate("2024-01-05", "14:30:00")

    const result = configureBillingCycleSubscription({
      currentCycleStartAt: startMs,
      trialDays: 20,
      billingCycleStart: 15, // Anchor on 15th
      billingPeriod: "month",
    })

    const trialEndMs = utcDate("2024-01-25", "14:29:59.999")

    // During trial, cycle should be from start to trial end
    expect(result.cycleStartMs).toEqual(startMs)
    expect(result.cycleEndMs).toEqual(trialEndMs)
    expect(result.trialEndsAtMs).toEqual(trialEndMs)
    expect(result.prorationFactor).toBe(0)
    expect(result.billableSeconds).toBe(0)
  })
})
