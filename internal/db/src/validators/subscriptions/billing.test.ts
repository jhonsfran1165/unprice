import { differenceInSeconds } from "date-fns"
import { describe, expect, it } from "vitest"
import { calculateNextInterval, configureBillingCycleSubscription } from "./billing"

const utcDate = (dateString: string, time = "00:00:00") =>
  new Date(`${dateString}T${time}Z`).getTime()

// const consoleLogSpy = vi.spyOn(console, "info")

describe("Billing Calculations", () => {
  describe("calculateNextInterval", () => {
    it("handles basic intervals", () => {
      const startMs = utcDate("2024-01-01")
      const result = calculateNextInterval(
        startMs,
        {
          name: "test",
          billingInterval: "month",
          billingIntervalCount: 1,
          planType: "recurring",
          billingAnchor: 1,
        },
        {
          alignToCalendar: true,
          alignStartToDay: false,
          alignEndToDay: true,
        }
      )

      expect(result.start).toBe(startMs)
      expect(result.end).toBe(utcDate("2024-02-01", "23:59:59.999"))
    })

    it("handles month intervals with anchor", () => {
      const startMs = utcDate("2024-01-10")
      const result = calculateNextInterval(
        startMs,
        {
          name: "test",
          billingInterval: "month",
          billingIntervalCount: 1,
          planType: "recurring",
          billingAnchor: 15,
        },
        {
          alignToCalendar: true,
          alignStartToDay: false,
          alignEndToDay: true,
        }
      )

      expect(result.start).toBe(startMs)
      expect(result.end).toBe(utcDate("2024-01-15", "23:59:59.999"))
    })

    it("handles month end dates correctly", () => {
      const startMs = utcDate("2024-01-15")
      const result = calculateNextInterval(
        startMs,
        {
          name: "test",
          billingInterval: "month",
          billingIntervalCount: 1,
          planType: "recurring",
          billingAnchor: 31,
        },
        {
          alignToCalendar: true,
          alignStartToDay: false,
          alignEndToDay: true,
        }
      )

      expect(result.start).toBe(startMs)
      expect(result.end).toBe(utcDate("2024-01-31", "23:59:59.999"))
    })

    it("handles year intervals with anchor", () => {
      const startMs = utcDate("2024-02-01")
      const result = calculateNextInterval(
        startMs,
        {
          name: "test",
          billingInterval: "year",
          billingIntervalCount: 1,
          planType: "recurring",
          billingAnchor: 3,
        },
        {
          alignToCalendar: true,
          alignStartToDay: false,
          alignEndToDay: true,
        }
      )

      expect(result.start).toBe(startMs)
      expect(result.end).toBe(utcDate("2024-03-31", "23:59:59.999"))
    })

    it("handles leap years correctly", () => {
      const startMs = utcDate("2024-01-15")
      const result = calculateNextInterval(
        startMs,
        {
          name: "test",
          billingInterval: "year",
          billingIntervalCount: 1,
          planType: "recurring",
          billingAnchor: 2,
        },
        {
          alignToCalendar: true,
          alignStartToDay: false,
          alignEndToDay: true,
        }
      )

      expect(result.start).toBe(startMs)
      expect(result.end).toBe(utcDate("2024-02-29", "23:59:59.999")) // Leap year
    })

    it("handles multiple interval counts", () => {
      const startMs = utcDate("2024-01-01")
      const result = calculateNextInterval(
        startMs,
        {
          name: "test",
          billingInterval: "month",
          billingIntervalCount: 3,
          planType: "recurring",
          billingAnchor: 15,
        },
        {
          alignToCalendar: true,
          alignStartToDay: false,
          alignEndToDay: true,
        }
      )

      expect(result.start).toBe(startMs)
      expect(result.end).toBe(utcDate("2024-03-15", "23:59:59.999"))
    })
  })

  describe("configureBillingCycleSubscription", () => {
    it("handles trial periods", () => {
      const startMs = utcDate("2024-01-01")
      const result = configureBillingCycleSubscription({
        currentCycleStartAt: startMs,
        trialDays: 7,
        billingConfig: {
          name: "test",
          billingInterval: "month",
          billingIntervalCount: 1,
          planType: "recurring",
          billingAnchor: 1,
        },
        alignStartToDay: false,
        alignEndToDay: true,
      })

      expect(result.cycleEndMs).toBe(utcDate("2024-01-07", "23:59:59.999"))
    })
  })
})

describe("configureBillingCycleSubscription", () => {
  describe("one-time billing", () => {
    it("should handle one-time payment without trial", () => {
      const startMs = utcDate("2024-01-01", "12:00:00")

      const result = configureBillingCycleSubscription({
        currentCycleStartAt: startMs,
        trialDays: 0,
        billingConfig: {
          name: "test",
          billingInterval: "onetime",
          billingIntervalCount: 1,
          planType: "onetime",
        },
        alignStartToDay: false,
        alignEndToDay: true,
      })

      expect(result.cycleStartMs).toEqual(startMs)
      expect(result.cycleEndMs).toEqual(utcDate("9999-12-31", "23:59:59.999"))
      expect(result.secondsInCycle).toBe(Number.POSITIVE_INFINITY)
      expect(result.prorationFactor).toBe(1)
      expect(result.billableSeconds).toBe(Number.POSITIVE_INFINITY)
      expect(result.trialEndsAtMs).toBeUndefined()
    })

    it("should handle one-time payment with trial", () => {
      const startMs = utcDate("2024-01-01", "12:00:00")
      const trialDays = 14

      const result = configureBillingCycleSubscription({
        currentCycleStartAt: startMs,
        trialDays,
        billingConfig: {
          name: "test",
          billingInterval: "onetime",
          billingIntervalCount: 1,
          planType: "onetime",
        },
        alignStartToDay: false,
        alignEndToDay: true,
      })

      const expectedTrialEndMs = utcDate("2024-01-15", "11:59:59.999")

      expect(result.cycleStartMs).toEqual(startMs)
      expect(result.trialEndsAtMs).toEqual(expectedTrialEndMs)
      expect(result.cycleEndMs).toEqual(expectedTrialEndMs)
      expect(result.prorationFactor).toBe(0)
      expect(result.billableSeconds).toBe(0)
    })
  })

  describe("recurring billing periods", () => {
    describe("monthly billing", () => {
      it("should handle start of month billing cycle", () => {
        const startMs = utcDate("2024-01-01", "12:00:00")

        const result = configureBillingCycleSubscription({
          currentCycleStartAt: startMs,
          trialDays: 0,
          billingConfig: {
            name: "test",
            billingInterval: "month",
            billingIntervalCount: 1,
            planType: "recurring",
            billingAnchor: 1,
          },
          alignStartToDay: false,
          alignEndToDay: true,
        })

        expect(result.cycleStartMs).toEqual(startMs)
        expect(result.cycleEndMs).toEqual(utcDate("2024-02-01", "23:59:59.999"))
      })

      it("should handle mid-month start with future anchor", () => {
        const startMs = utcDate("2024-01-05", "12:00:00")

        const result = configureBillingCycleSubscription({
          currentCycleStartAt: startMs,
          trialDays: 0,
          billingConfig: {
            name: "test",
            billingInterval: "month",
            billingIntervalCount: 1,
            planType: "recurring",
            billingAnchor: 15,
          },
          alignStartToDay: false,
          alignEndToDay: true,
          alignToCalendar: true,
        })

        expect(result.cycleStartMs).toEqual(startMs)
        expect(result.cycleEndMs).toEqual(utcDate("2024-01-15", "23:59:59.999"))
      })

      it("should handle end of month edge cases in leap year", () => {
        const startMs = utcDate("2024-02-01", "12:00:00")

        const result = configureBillingCycleSubscription({
          currentCycleStartAt: startMs,
          trialDays: 0,
          billingConfig: {
            name: "test",
            billingInterval: "month",
            billingIntervalCount: 1,
            planType: "recurring",
            billingAnchor: 31,
          },
          alignStartToDay: false,
          alignEndToDay: true,
          alignToCalendar: true,
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
          trialDays: 0,
          billingConfig: {
            name: "test",
            billingInterval: "minute",
            billingIntervalCount: 5,
            planType: "recurring",
            billingAnchor: 0,
          },
        })

        expect(result.cycleStartMs).toEqual(startMs)
        expect(result.cycleEndMs).toEqual(utcDate("2024-01-01", "12:04:59.999"))
        expect(result.secondsInCycle).toBe(5 * 60 - 1)
        expect(result.billableSeconds).toBe(5 * 60 - 1)
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
        billingConfig: {
          name: "test",
          billingInterval: "month",
          billingIntervalCount: 1,
          planType: "recurring",
          billingAnchor: 1,
        },
        alignStartToDay: false,
        alignEndToDay: true,
      })

      const expectedTrialEndMs = utcDate("2024-01-08", "15:29:59.999")

      expect(result.cycleStartMs).toEqual(startMs)
      expect(result.cycleEndMs).toEqual(expectedTrialEndMs)
      expect(result.trialEndsAtMs).toEqual(expectedTrialEndMs)
      expect(result.prorationFactor).toBe(0)
      expect(result.billableSeconds).toBe(0)
    })

    it("should handle trial period with early end date", () => {
      const startMs = utcDate("2024-01-01", "12:00:00")
      const endMs = utcDate("2024-01-05", "12:00:00")

      const result = configureBillingCycleSubscription({
        currentCycleStartAt: startMs,
        trialDays: 7,
        billingConfig: {
          name: "test",
          billingInterval: "month",
          billingIntervalCount: 1,
          planType: "recurring",
          billingAnchor: 1,
        },
        alignStartToDay: false,
        alignEndToDay: true,
        endAt: endMs,
      })

      expect(result.cycleStartMs).toEqual(startMs)
      expect(result.cycleEndMs).toEqual(endMs)
      expect(result.trialEndsAtMs).toEqual(utcDate("2024-01-08", "11:59:59.999"))
    })
  })

  describe("proration calculations", () => {
    it("should calculate correct proration for partial month", () => {
      const startMs = utcDate("2024-01-15", "12:00:00")

      const result = configureBillingCycleSubscription({
        currentCycleStartAt: startMs,
        trialDays: 0,
        billingConfig: {
          name: "test",
          billingInterval: "month",
          billingIntervalCount: 1,
          planType: "recurring",
          billingAnchor: 1,
        },
        alignStartToDay: false,
        alignEndToDay: true,
      })

      expect(result.cycleStartMs).toEqual(startMs)
      expect(result.cycleEndMs).toEqual(utcDate("2024-02-01", "23:59:59.999"))

      const totalSeconds = differenceInSeconds(
        utcDate("2024-02-01", "23:59:59.999"),
        utcDate("2024-01-01", "00:00:00")
      )
      const billableSeconds = differenceInSeconds(utcDate("2024-02-01", "23:59:59.999"), startMs)

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
          trialDays: 0,
          billingConfig: {
            name: "test",
            billingInterval: "month",
            billingIntervalCount: 1,
            planType: "recurring",
            billingAnchor: 1,
          },
          alignStartToDay: false,
          alignEndToDay: true,
          endAt: endMs,
          alignToCalendar: true,
        })
      ).toThrow("Effective start date is after the effective end date")
    })
  })

  describe("yearly billing", () => {
    it("should handle start date in month before anchor month", () => {
      const startMs = utcDate("2024-02-15", "14:30:00")

      const result = configureBillingCycleSubscription({
        currentCycleStartAt: startMs,
        trialDays: 0,
        billingConfig: {
          name: "test",
          billingInterval: "year",
          billingIntervalCount: 1,
          planType: "recurring",
          billingAnchor: 3,
        },
        alignStartToDay: false,
        alignEndToDay: true,
      })

      expect(result.cycleStartMs).toEqual(startMs)
      expect(result.cycleEndMs).toEqual(utcDate("2024-03-31", "23:59:59.999"))
    })

    it("should handle start date in anchor month", () => {
      const startMs = utcDate("2024-03-15", "14:30:00")

      const result = configureBillingCycleSubscription({
        currentCycleStartAt: startMs,
        trialDays: 0,
        billingConfig: {
          name: "test",
          billingInterval: "year",
          billingIntervalCount: 1,
          planType: "recurring",
          billingAnchor: 3,
        },
        alignStartToDay: false,
        alignEndToDay: true,
      })

      expect(result.cycleStartMs).toEqual(startMs)
      expect(result.cycleEndMs).toEqual(utcDate("2025-03-31", "23:59:59.999"))
    })

    it("should handle start date after anchor month", () => {
      const startMs = utcDate("2024-04-15", "14:30:00")

      const result = configureBillingCycleSubscription({
        currentCycleStartAt: startMs,
        trialDays: 0,
        billingConfig: {
          name: "test",
          billingInterval: "year",
          billingIntervalCount: 1,
          planType: "recurring",
          billingAnchor: 3,
        },
        alignStartToDay: false,
        alignEndToDay: true,
      })

      expect(result.cycleStartMs).toEqual(startMs)
      expect(result.cycleEndMs).toEqual(utcDate("2025-03-31", "23:59:59.999"))
    })
  })

  describe("monthly billing edge cases", () => {
    it("should handle month transitions with 31 days to 30 days", () => {
      const startMs = utcDate("2024-01-31", "14:30:00")

      const result = configureBillingCycleSubscription({
        currentCycleStartAt: startMs,
        trialDays: 0,
        billingConfig: {
          name: "test",
          billingInterval: "month",
          billingIntervalCount: 1,
          planType: "recurring",
          billingAnchor: 31,
        },
        alignStartToDay: false,
        alignEndToDay: true,
      })

      expect(result.cycleStartMs).toEqual(startMs)
      expect(result.cycleEndMs).toEqual(utcDate("2024-02-29", "23:59:59.999"))
    })

    it("should handle month transitions with 30 days to 31 days", () => {
      const startMs = utcDate("2024-04-30", "14:30:00")

      const result = configureBillingCycleSubscription({
        currentCycleStartAt: startMs,
        trialDays: 0,
        billingConfig: {
          name: "test",
          billingInterval: "month",
          billingIntervalCount: 1,
          planType: "recurring",
          billingAnchor: 30,
        },
        alignStartToDay: false,
        alignEndToDay: true,
      })

      expect(result.cycleStartMs).toEqual(startMs)
      expect(result.cycleEndMs).toEqual(utcDate("2024-05-30", "23:59:59.999"))
    })

    it("should handle start date on last day of month", () => {
      const startMs = utcDate("2028-02-29", "14:30:00")

      const result = configureBillingCycleSubscription({
        currentCycleStartAt: startMs,
        trialDays: 0,
        billingConfig: {
          name: "test",
          billingInterval: "month",
          billingIntervalCount: 1,
          planType: "recurring",
          billingAnchor: 31,
        },
        alignStartToDay: false,
        alignEndToDay: true,
        alignToCalendar: true,
      })

      expect(result.cycleStartMs).toEqual(startMs)
      expect(result.cycleEndMs).toEqual(utcDate("2028-03-31", "23:59:59.999"))
    })
  })

  describe("trial period edge cases", () => {
    it("should handle trial ending on month boundary", () => {
      const startMs = utcDate("2024-01-15", "00:00:00")

      const result = configureBillingCycleSubscription({
        currentCycleStartAt: startMs,
        trialDays: 17, // Trial ends Feb 1st
        billingConfig: {
          name: "test",
          billingInterval: "month",
          billingIntervalCount: 1,
          planType: "recurring",
          billingAnchor: 1,
        },
        alignStartToDay: false,
        alignEndToDay: true,
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
        billingConfig: {
          name: "test",
          billingInterval: "month",
          billingIntervalCount: 1,
          planType: "recurring",
          billingAnchor: 1,
        },
        alignStartToDay: false,
        alignEndToDay: true,
        endAt: endMs,
      })

      expect(result.cycleStartMs).toEqual(startMs)
      expect(result.cycleEndMs).toEqual(endMs)
      expect(result.trialEndsAtMs).toEqual(utcDate("2024-01-14", "23:59:59.999"))
    })
  })

  describe("monthly billing", () => {
    it("should handle start exactly on anchor", () => {
      const startMs = utcDate("2024-01-15", "00:00:00")

      const result = configureBillingCycleSubscription({
        currentCycleStartAt: startMs,
        trialDays: 0,
        billingConfig: {
          name: "test",
          billingInterval: "month",
          billingIntervalCount: 1,
          planType: "recurring",
          billingAnchor: 15,
        },
        alignStartToDay: false,
        alignEndToDay: true,
        alignToCalendar: true,
      })

      // If starting on anchor (15th), take full interval
      expect(result.cycleStartMs).toEqual(startMs)
      expect(result.cycleEndMs).toEqual(utcDate("2024-02-15", "23:59:59.999"))
    })
  })
})

describe("billing cycle anchor handling", () => {
  it("should handle subscription start before anchor in same month", () => {
    const startMs = utcDate("2024-01-05", "14:30:00")

    const result = configureBillingCycleSubscription({
      currentCycleStartAt: startMs,
      trialDays: 0,
      billingConfig: {
        name: "test",
        billingInterval: "month",
        billingIntervalCount: 1,
        planType: "recurring",
        billingAnchor: 15,
      },
      alignStartToDay: false,
      alignEndToDay: true,
      alignToCalendar: true,
    })

    expect(result.cycleStartMs).toEqual(startMs)
    expect(result.cycleEndMs).toEqual(utcDate("2024-01-15", "23:59:59.999"))

    const fullCycleSeconds = differenceInSeconds(
      utcDate("2024-02-15", "23:59:59.999"),
      utcDate("2024-01-15", "00:00:00")
    )

    const billableSeconds = differenceInSeconds(utcDate("2024-01-15", "23:59:59.999"), startMs)

    expect(result.secondsInCycle).toBe(fullCycleSeconds)
    expect(result.billableSeconds).toBe(billableSeconds)
    expect(result.prorationFactor).toBe(billableSeconds / fullCycleSeconds)
  })

  it("should handle subscription start after anchor requiring next month alignment", () => {
    const startMs = utcDate("2024-01-20", "14:30:00")

    const result = configureBillingCycleSubscription({
      currentCycleStartAt: startMs,
      trialDays: 0,
      billingConfig: {
        name: "test",
        billingInterval: "month",
        billingIntervalCount: 1,
        planType: "recurring",
        billingAnchor: 15,
      },
      alignStartToDay: false,
      alignEndToDay: true,
      alignToCalendar: true,
    })

    // First period should be partial - from start to next anchor
    expect(result.cycleStartMs).toEqual(startMs)
    expect(result.cycleEndMs).toEqual(utcDate("2024-02-15", "23:59:59.999"))

    const fullCycleSeconds = differenceInSeconds(
      utcDate("2024-02-15", "23:59:59.999"),
      utcDate("2024-01-15", "00:00:00")
    )

    const billableSeconds = differenceInSeconds(utcDate("2024-02-15", "23:59:59.999"), startMs)

    expect(result.secondsInCycle).toBe(fullCycleSeconds)
    expect(result.billableSeconds).toBe(billableSeconds)
    expect(result.prorationFactor).toBe(billableSeconds / fullCycleSeconds)
  })

  it("should handle subscription start exactly on anchor", () => {
    const startMs = utcDate("2024-01-15", "00:00:00")

    const result = configureBillingCycleSubscription({
      currentCycleStartAt: startMs,
      trialDays: 0,
      billingConfig: {
        name: "test",
        billingInterval: "month",
        billingIntervalCount: 1,
        planType: "recurring",
        billingAnchor: 15,
      },
      alignStartToDay: false,
      alignEndToDay: true,
      alignToCalendar: true,
    })

    // Should start a full period from the anchor
    expect(result.cycleStartMs).toEqual(startMs)
    expect(result.cycleEndMs).toEqual(utcDate("2024-02-15", "23:59:59.999"))

    const secondsInCycle = differenceInSeconds(
      utcDate("2024-02-15", "23:59:59.999"),
      utcDate("2024-01-15", "00:00:00")
    )

    expect(result.secondsInCycle).toBe(secondsInCycle)
    expect(result.billableSeconds).toBe(secondsInCycle)
    expect(result.prorationFactor).toBe(1)
  })

  it("should handle yearly billing with month anchor", () => {
    const startMs = utcDate("2024-02-15", "14:30:00")

    const result = configureBillingCycleSubscription({
      currentCycleStartAt: startMs,
      trialDays: 0,
      billingConfig: {
        name: "test",
        billingInterval: "year",
        billingIntervalCount: 1,
        planType: "recurring",
        billingAnchor: 3,
      },
      alignStartToDay: false,
      alignEndToDay: true,
      alignToCalendar: true,
    })

    // First period should be partial - from start to just before next anchor
    expect(result.cycleStartMs).toEqual(startMs)
    expect(result.cycleEndMs).toEqual(utcDate("2024-03-31", "23:59:59.999"))

    const fullCycleSeconds = differenceInSeconds(
      utcDate("2025-03-31", "23:59:59.999"),
      utcDate("2024-03-01", "00:00:00")
    )

    const billableSeconds = differenceInSeconds(utcDate("2024-03-31", "23:59:59.999"), startMs)

    expect(result.secondsInCycle).toBe(fullCycleSeconds)
    expect(result.billableSeconds).toBe(billableSeconds)
    expect(result.prorationFactor).toBe(billableSeconds / fullCycleSeconds)
  })

  it("should handle trial period with anchor alignment", () => {
    const startMs = utcDate("2024-01-05", "14:30:00")

    const result = configureBillingCycleSubscription({
      currentCycleStartAt: startMs,
      trialDays: 20,
      billingConfig: {
        name: "test",
        billingInterval: "month",
        billingIntervalCount: 1,
        planType: "recurring",
        billingAnchor: 15,
      },
      alignStartToDay: false,
      alignEndToDay: true,
      alignToCalendar: true,
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
