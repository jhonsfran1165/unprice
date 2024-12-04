import type { Database } from "@unprice/db"
import {
  type Subscription,
  type SubscriptionPhaseExtended,
  configureBillingCycleSubscription,
} from "@unprice/db/validators"
import { Ok } from "@unprice/error"
import type { Logger } from "@unprice/logging"
import type { Analytics } from "@unprice/tinybird"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockDatabase, createMockPhase, createMockSubscription, mockCustomer } from "./mock"
import { PhaseMachine } from "./phase-machine"

describe("PhaseMachine", () => {
  let machine: PhaseMachine
  let mockDb: Database
  let mockAnalytics: Analytics
  let mockLogger: Logger
  let mockPhase: SubscriptionPhaseExtended
  let mockSubscription: Subscription
  let paymentProviderService = {}

  const startDate = new Date("2024-01-01T00:00:00Z")
  const billingPeriod = "month"
  const trialDays = 15
  const billingCycleStart = 1

  const calculatedBillingCycle = configureBillingCycleSubscription({
    currentCycleStartAt: startDate.getTime(),
    trialDays,
    billingCycleStart,
    billingPeriod,
  })

  beforeEach(() => {
    // Mock analytics
    mockAnalytics = {
      getTotalUsagePerFeature: vi.fn((input) => {
        const result = {
          sum: 0,
          max: 0,
          count: 0,
          last_during_period: 0,
        }

        if (input.featureSlug === "api-calls") {
          result.sum = 567
          result.max = 343
          result.count = 123
          result.last_during_period = 878
        }

        return Promise.resolve({ data: [result] })
      }),
    } as unknown as Analytics

    // Mock logger
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
    } as unknown as Logger

    mockPhase = createMockPhase({
      calculatedBillingCycle,
      trialDays,
      billingCycleStart,
    })

    mockSubscription = createMockSubscription({
      mockPhase,
      calculatedBillingCycle,
    })

    mockDb = createMockDatabase({
      mockSubscription,
      mockPhase,
    })

    machine = new PhaseMachine({
      db: mockDb,
      phase: mockPhase,
      subscription: mockSubscription,
      customer: mockCustomer,
      logger: mockLogger,
      analytics: mockAnalytics,
      isTest: true,
    })

    // mock payment method calls
    paymentProviderService = {
      getDefaultPaymentMethodId: vi.fn().mockReturnValue(Ok({ paymentMethodId: "12345" })),
    }

    Object.defineProperty(machine, "paymentProviderService", {
      value: paymentProviderService,
    })
  })

  describe("endTrial", () => {
    it("should not end trial before trial end date", async () => {
      const tooEarly = new Date("2024-01-10T00:00:00Z").getTime()
      const result = await machine.transition("END_TRIAL", { now: tooEarly })

      expect(result.err?.message).toBe("Trial has not ended yet")
    })

    it("should successfully end trial on trial end date - pay_in_arrear", async () => {
      // modify the machine to have pay_in_arrear
      machine = new PhaseMachine({
        db: mockDb,
        phase: {
          ...mockPhase,
          whenToBill: "pay_in_arrear",
        },
        subscription: mockSubscription,
        customer: mockCustomer,
        logger: mockLogger,
        analytics: mockAnalytics,
        isTest: true,
      })

      Object.defineProperty(machine, "paymentProviderService", {
        value: paymentProviderService,
      })

      // new start and end dates for the next cycle
      const { cycleStart, cycleEnd } = configureBillingCycleSubscription({
        currentCycleStartAt: mockSubscription.currentCycleEndAt + 1, // add one millisecond to avoid overlapping with the current cycle
        billingCycleStart: mockPhase.startCycle, // start day of the billing cycle
        billingPeriod: mockPhase.planVersion.billingPeriod, // billing period
        endAt: mockPhase.endAt ?? undefined, // end day of the billing cycle if any
      })

      const result = await machine.transition("END_TRIAL", {
        // right after the trial ends
        now: calculatedBillingCycle.trialDaysEndAt!.getTime() + 1,
      })

      const phase = machine.getPhase()
      const subscription = machine.getSubscription()

      expect(result.err).toBeUndefined()
      // dates should be renewed for the next cycle
      expect(subscription.currentCycleEndAt).toBe(cycleEnd.getTime())
      expect(subscription.currentCycleStartAt).toBe(cycleStart.getTime())

      // if phase is pay in arrear, it should be active
      expect(phase.status).toBe("active")
      expect(subscription.nextInvoiceAt).toBe(cycleEnd.getTime() + 1)
    })

    it("should successfully end trial on trial end date - pay_in_advance", async () => {
      // modify the machine to have pay_in_arrear
      machine = new PhaseMachine({
        db: mockDb,
        phase: {
          ...mockPhase,
          whenToBill: "pay_in_advance",
        },
        subscription: mockSubscription,
        customer: mockCustomer,
        logger: mockLogger,
        analytics: mockAnalytics,
        isTest: true,
      })

      Object.defineProperty(machine, "paymentProviderService", {
        value: paymentProviderService,
      })

      // new start and end dates for the next cycle
      const { cycleStart, cycleEnd } = configureBillingCycleSubscription({
        currentCycleStartAt: mockSubscription.currentCycleEndAt + 1, // add one millisecond to avoid overlapping with the current cycle
        billingCycleStart: mockPhase.startCycle, // start day of the billing cycle
        billingPeriod: mockPhase.planVersion.billingPeriod, // billing period
        endAt: mockPhase.endAt ?? undefined, // end day of the billing cycle if any
      })

      const result = await machine.transition("END_TRIAL", {
        // right after the trial ends
        now: calculatedBillingCycle.trialDaysEndAt!.getTime() + 1,
      })

      const phase = machine.getPhase()
      const subscription = machine.getSubscription()

      expect(result.err).toBeUndefined()
      // dates should be renewed for the next cycle
      expect(subscription.currentCycleEndAt).toBe(cycleEnd.getTime())
      expect(subscription.currentCycleStartAt).toBe(cycleStart.getTime())

      expect(phase.status).toBe("trial_ended")
      expect(subscription.nextInvoiceAt).toBe(cycleStart.getTime() + 1)
    })

    it("should validate payment method", async () => {
      // modify the machine to have no payment method
      machine = new PhaseMachine({
        db: mockDb,
        phase: {
          ...mockPhase,
          paymentMethodId: null,
        },
        subscription: mockSubscription,
        customer: mockCustomer,
        logger: mockLogger,
        analytics: mockAnalytics,
        isTest: true,
      })

      const paymentProviderService = {
        getDefaultPaymentMethodId: vi.fn().mockReturnValue(Ok({ paymentMethodId: "" })),
      }

      Object.defineProperty(machine, "paymentProviderService", {
        value: paymentProviderService,
      })

      const result = await machine.transition("END_TRIAL", {
        // right after the trial ends
        now: calculatedBillingCycle.trialDaysEndAt!.getTime() + 1,
      })

      expect(result.err?.message).contains("Customer has no payment method")
    })

    it("should validate transition if already ended", async () => {
      // modify the machine to have no payment method
      machine = new PhaseMachine({
        db: mockDb,
        phase: mockPhase,
        subscription: mockSubscription,
        customer: mockCustomer,
        logger: mockLogger,
        analytics: mockAnalytics,
        isTest: true,
      })

      Object.defineProperty(machine, "paymentProviderService", {
        value: paymentProviderService,
      })

      await machine.transition("END_TRIAL", {
        // right after the trial ends
        now: calculatedBillingCycle.trialDaysEndAt!.getTime() + 1,
      })

      const result = await machine.transition("END_TRIAL", {
        // right after the trial ends
        now: calculatedBillingCycle.trialDaysEndAt!.getTime() + 1,
      })

      // TODO: Handle year and custom billing cycles
      expect(result.err?.message).contains("Invalid transition: END_TRIAL from trial_ended")
    })
  })
})
