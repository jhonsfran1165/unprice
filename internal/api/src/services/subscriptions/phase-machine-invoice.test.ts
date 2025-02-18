import type { Database } from "@unprice/db"
import {
  type Subscription,
  type SubscriptionPhaseExtended,
  configureBillingCycleSubscription,
} from "@unprice/db/validators"
import { Ok } from "@unprice/error"
import type { Logger } from "@unprice/logging"
import type { Analytics } from "@unprice/tinybird"
import { addDays } from "date-fns"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { UnPriceSubscriptionError } from "./errors"
import {
  createMockDatabase,
  createMockInvoice,
  createMockPhase,
  createMockSubscription,
  mockCustomer,
} from "./mock"
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
      getFeaturesUsage: vi.fn((input) => {
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
      paymentProviderToken: "12345",
    })

    // mock payment method calls
    paymentProviderService = {
      getDefaultPaymentMethodId: vi.fn().mockReturnValue(Ok({ paymentMethodId: "12345" })),
    }

    Object.defineProperty(machine, "paymentProviderService", {
      value: paymentProviderService,
    })
  })

  describe("invoice", () => {
    it("should not invoice before expected invoice date", async () => {
      const trial = await machine.transition("END_TRIAL", {
        // right after the trial ends
        now: calculatedBillingCycle.trialEndsAtMs! + 1,
      })

      expect(trial.err).toBeUndefined()
      expect(trial.val?.status).toBe("trial_ended")

      const result = await machine.transition("INVOICE", {
        now: calculatedBillingCycle.trialEndsAtMs! + 1,
      })

      expect(result.err?.message).toBe("Subscription is not ready to be invoiced")
    })

    it("should invoice - pay_in_arrear", async () => {
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
        paymentProviderToken: "12345",
      })

      Object.defineProperty(machine, "paymentProviderService", {
        value: paymentProviderService,
      })

      const trial = await machine.transition("END_TRIAL", {
        // right after the trial ends
        now: calculatedBillingCycle.trialEndsAtMs! + 1,
      })

      expect(trial.err).toBeUndefined()
      // it should be active when pay_in_arrear
      expect(trial.val?.status).toBe("active")

      // tries to renew the subscription before the invoice date
      const renew = await machine.transition("RENEW", {
        now: calculatedBillingCycle.trialEndsAtMs! + 1,
      })

      expect(renew.err).toBeInstanceOf(UnPriceSubscriptionError)
      expect(renew.err?.message).toBe(
        "Subscription has not been invoiced, invoice the current cycle first"
      )

      // let's try to invoice before the invoice date
      const result = await machine.transition("INVOICE", {
        // when subscription is arrear the invoice date is the end of the billing cycle
        now: calculatedBillingCycle.cycleEndMs + 1,
      })

      expect(result.err).toBeInstanceOf(UnPriceSubscriptionError)
      expect(result.err?.message).toBe("Subscription is not ready to be invoiced")

      // new start and end dates for the next cycle
      const { cycleEndMs } = configureBillingCycleSubscription({
        currentCycleStartAt: mockSubscription.currentCycleEndAt + 1, // add one millisecond to avoid overlapping with the current cycle
        billingCycleStart: mockPhase.startCycle, // start day of the billing cycle
        billingPeriod: mockPhase.planVersion.billingPeriod, // billing period
        endAt: mockPhase.endAt ?? undefined, // end day of the billing cycle if any
      })

      // let's try to invoice on the expected invoice date
      const result2 = await machine.transition("INVOICE", {
        now: cycleEndMs + 1,
      })

      const subscription = machine.getSubscription()
      const phase = machine.getPhase()

      expect(result2.err).toBeUndefined()
      expect(result2.val?.status).toBe("active")

      // status of the invoice should be draft
      expect(result2.val?.invoice?.status).toBe("draft")

      // pay in arrear should be hybrid
      // flat charges and usage charges
      expect(result2.val?.invoice?.type).toBe("hybrid")

      // due date should be calculated based on grace period
      const dueAt = subscription.currentCycleEndAt + 1
      const pastDueAt = addDays(dueAt, phase.gracePeriod).getTime()

      expect(result2.val?.invoice?.pastDueAt).toBe(pastDueAt)
      expect(result2.val?.invoice?.dueAt).toBe(dueAt)
    })

    it("should invoice - pay_in_advance", async () => {
      // modify the machine to have pay_in_advance
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
        paymentProviderToken: "12345",
      })

      Object.defineProperty(machine, "paymentProviderService", {
        value: paymentProviderService,
      })

      const trial = await machine.transition("END_TRIAL", {
        // right after the trial ends
        now: calculatedBillingCycle.trialEndsAtMs! + 1,
      })

      expect(trial.err).toBeUndefined()
      // it should be active when pay_in_advance
      expect(trial.val?.status).toBe("trial_ended")

      const result = await machine.transition("INVOICE", {
        // when subscription is advance the invoice date is the start of the billing cycle
        now: calculatedBillingCycle.cycleStartMs + 1,
      })

      expect(result.err?.message).toBe("Subscription is not ready to be invoiced")

      // new start and end dates for the next cycle
      const { cycleStartMs } = configureBillingCycleSubscription({
        currentCycleStartAt: mockSubscription.currentCycleEndAt + 1, // add one millisecond to avoid overlapping with the current cycle
        billingCycleStart: mockPhase.startCycle, // start day of the billing cycle
        billingPeriod: mockPhase.planVersion.billingPeriod, // billing period
        endAt: mockPhase.endAt ?? undefined, // end day of the billing cycle if any
      })

      // let's try to invoice on the expected invoice date
      const result2 = await machine.transition("INVOICE", {
        now: cycleStartMs + 1,
      })

      const subscription = machine.getSubscription()
      const phase = machine.getPhase()

      expect(result2.err).toBeUndefined()
      // still trial ended until the payment is processed
      expect(result2.val?.status).toBe("trial_ended")

      // pay in advance should be flat
      expect(result2.val?.invoice?.type).toBe("flat")

      // status of the invoice should be draft
      expect(result2.val?.invoice?.status).toBe("draft")

      // due date should be calculated based on grace period
      const dueAt = subscription.currentCycleStartAt + 1
      const pastDueAt = addDays(dueAt, phase.gracePeriod).getTime()
      expect(result2.val?.invoice?.pastDueAt).toBe(pastDueAt)
      expect(result2.val?.invoice?.dueAt).toBe(dueAt)
    })

    it("should invoice - pay_in_advance with pending invoice", async () => {
      // mock an invoice that is pending
      const mockInvoice = createMockInvoice({
        mockPhase,
        mockSubscription,
      })

      mockDb = createMockDatabase({
        mockSubscription,
        mockPhase,
        mockInvoice,
      })

      // modify the machine to have pay_in_advance
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
        paymentProviderToken: "12345",
      })

      Object.defineProperty(machine, "paymentProviderService", {
        value: paymentProviderService,
      })

      const trial = await machine.transition("END_TRIAL", {
        // right after the trial ends
        now: calculatedBillingCycle.trialEndsAtMs! + 1,
      })

      expect(trial.err).toBeUndefined()
      // it should be active when pay_in_advance
      expect(trial.val?.status).toBe("trial_ended")

      const result = await machine.transition("INVOICE", {
        // when subscription is advance the invoice date is the start of the billing cycle
        now: calculatedBillingCycle.trialEndsAtMs! + 1,
      })

      expect(result.err?.message).toBe("Subscription is not ready to be invoiced")

      // new start and end dates for the next cycle
      const { cycleStartMs } = configureBillingCycleSubscription({
        currentCycleStartAt: mockSubscription.currentCycleEndAt + 1, // add one millisecond to avoid overlapping with the current cycle
        billingCycleStart: mockPhase.startCycle, // start day of the billing cycle
        billingPeriod: mockPhase.planVersion.billingPeriod, // billing period
        endAt: mockPhase.endAt ?? undefined, // end day of the billing cycle if any
      })

      // let's try to invoice on the expected invoice date
      const result2 = await machine.transition("INVOICE", {
        now: cycleStartMs + 1,
      })

      const subscription = machine.getSubscription()
      const phase = machine.getPhase()

      expect(result2.err).toBeUndefined()

      // should take the pending invoice and not generate a new one
      expect(result2.val?.invoice?.id).toBe(mockInvoice.id)

      // still trial ended until the payment is processed
      expect(result2.val?.status).toBe("trial_ended")

      // status of the invoice should be draft
      expect(result2.val?.invoice?.status).toBe("draft")

      // due date should be calculated based on grace period
      const dueAt = subscription.currentCycleStartAt + 1
      const pastDueAt = addDays(dueAt, phase.gracePeriod).getTime()
      expect(result2.val?.invoice?.pastDueAt).toBe(pastDueAt)
      expect(result2.val?.invoice?.dueAt).toBe(dueAt)
    })

    // TODO: test with pending invoice
  })
})
