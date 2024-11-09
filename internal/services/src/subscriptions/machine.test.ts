import { type Database } from "@unprice/db"
import { configureBillingCycleSubscription, type Customer, type Subscription, type SubscriptionPhaseExtended } from "@unprice/db/validators"
import { Ok } from "@unprice/error"
import { type Logger } from "@unprice/logging"
import { type Analytics } from "@unprice/tinybird"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { SubscriptionStateMachine } from "./machine"

describe("SubscriptionStateMachine", () => {
  let machine: SubscriptionStateMachine
  let mockDb: Database
  let mockAnalytics: Analytics
  let mockLogger: Logger

  const startDate = new Date("2024-01-01T00:00:00Z")
  const endDate = new Date("2024-01-31T23:59:59.999Z")
  const now = new Date("2024-01-01T00:00:00Z").getTime()
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
    // Mock database operations
    mockDb = {
      transaction: vi.fn((callback) => callback(mockDb)),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(() => Promise.resolve([{ id: "sub-1" }])),
          })),
        })),
      })),
      query: {
        invoices: {
          findFirst: vi.fn(() => Promise.resolve(null)),
        },
      },
    } as unknown as Database

    // Mock analytics
    mockAnalytics = {
      getTotalUsagePerFeature: vi.fn(() => Promise.resolve({ data: [] })),
    } as unknown as Analytics

    // Mock logger
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
    } as unknown as Logger

    const mockSubscription: Subscription = {
      id: "sub-1",
      status: "trialing",
      projectId: "proj-1",
      customerId: "cust-1",
      active: true,
      timezone: "UTC",
      createdAtM: now,
      updatedAtM: now,
      currentCycleStartAt: calculatedBillingCycle.cycleStart.getTime(),
      currentCycleEndAt: calculatedBillingCycle.cycleEnd.getTime(),
    } as Subscription

    const mockPhase: SubscriptionPhaseExtended = {
      id: "phase-1",
      subscriptionId: "sub-1",
      status: "trialing",
      projectId: "proj-1",
      planVersion: {
        id: "plan-version-1",
        planId: "plan-1",
        status: "published",
        createdAtM: now,
        updatedAtM: now,
        metadata: null,
        currency: "USD",
        projectId: "proj-1",
        description: "Test Plan",
        active: true,
        version: 1,
        latest: true,
        title: "Test Plan",
        tags: [],
        publishedAt: now,
        publishedBy: null,
        archived: null,
        archivedAt: null,
        archivedBy: null,
        paymentProvider: "stripe",
        planType: "recurring",
        billingPeriod: null,
        whenToBill: "pay_in_advance",
        startCycle: null,
        gracePeriod: null,
        collectionMethod: "charge_automatically",
        trialDays: 0,
        autoRenew: false,
        paymentMethodRequired: false
      },
      createdAtM: now,
      updatedAtM: now,
      paymentMethodId: "",
      active: true,
      trialDays,
      gracePeriod: 0,
      dueBehaviour: "cancel",
      trialEndsAt: calculatedBillingCycle.trialDaysEndAt?.getTime() ?? null,
      whenToBill: "pay_in_advance",
      collectionMethod: "charge_automatically",
      autoRenew: true,
      startCycle: billingCycleStart,
      items: [],
      metadata: null,
      startAt: calculatedBillingCycle.cycleStart.getTime(),
      endAt: calculatedBillingCycle.cycleEnd.getTime(),
      planVersionId: "plan-version-1",
    }

    const mockCustomer: Customer = {
      id: "cust-1",
      projectId: "proj-1",
      email: "test@test.com",
      name: "Test User",
      isMain: false,
      defaultCurrency: "USD",
      timezone: "UTC",
    } as Customer

    machine = new SubscriptionStateMachine({
      db: mockDb,
      activePhase: mockPhase,
      subscription: mockSubscription,
      customer: mockCustomer,
      logger: mockLogger,
      analytics: mockAnalytics,
    })
  })

  describe("endTrial", () => {
    it("should not end trial before trial end date", async () => {
      const tooEarly = new Date("2024-01-10T00:00:00Z").getTime()
      const result = await machine.endTrial({ now: tooEarly })

      expect(result.err?.message).toBe("Trial has not ended yet")
    })

    it("should successfully end trial on trial end date", async () => {
      const result = await machine.endTrial({
        now: calculatedBillingCycle.trialDaysEndAt?.getTime() ?? 0
      })

      expect(result.err).toBeUndefined()
      expect(result.val?.status).toBe("active")

      // Verify state updates were called
      expect(mockDb.update).toHaveBeenCalled()
    })

    it("should handle trial end with pay in advance billing", async () => {
      // Mock validateCustomerPaymentMethod success
      vi.spyOn(machine as any, "validateCustomerPaymentMethod")
        .mockResolvedValue(Ok(undefined))

      // Mock renewSubscription success
      vi.spyOn(machine as any, "renewSubscription")
        .mockResolvedValue(Ok(undefined))

      const result = await machine.endTrial({
        now: calculatedBillingCycle.trialDaysEndAt?.getTime() ?? 0
      })

      expect(result.err).toBeUndefined()
      expect(result.val?.status).toBe("active")
    })

  //   it("should handle trial end with pay in arrear billing", async () => {
  //     // Update phase to pay in arrear
  //     const mockPhase = {
  //       ...machine["activePhase"],
  //       whenToBill: "pay_in_arrear"
  //     }
  //     machine["setActivePhase"](mockPhase)

  //     // Mock validateCustomerPaymentMethod success
  //     vi.spyOn(machine as any, "validateCustomerPaymentMethod")
  //       .mockResolvedValue(Ok(undefined))

  //     // Mock renewSubscription success
  //     vi.spyOn(machine as any, "renewSubscription")
  //       .mockResolvedValue(Ok(undefined))

  //     const result = await machine.endTrial({
  //       now: calculatedBillingCycle.trialDaysEndAt?.getTime() ?? 0
  //     })

  //     expect(result.err).toBeUndefined()
  //     expect(result.val?.status).toBe("active")
  //   })

  //   it("should fail if payment method validation fails", async () => {
  //     // Mock validateCustomerPaymentMethod failure
  //     vi.spyOn(machine as any, "validateCustomerPaymentMethod")
  //       .mockResolvedValue({ err: new Error("Invalid payment method") })

  //     const result = await machine.endTrial({
  //       now: trialEndDate.getTime()
  //     })

  //     expect(result.err?.message).toBe("Invalid payment method")
  //   })

  //   it("should handle subscription renewal failure", async () => {
  //     // Mock validateCustomerPaymentMethod success
  //     vi.spyOn(machine as any, "validateCustomerPaymentMethod")
  //       .mockResolvedValue(Ok(undefined))

  //     // Mock renewSubscription failure
  //     vi.spyOn(machine as any, "renewSubscription")
  //       .mockResolvedValue({ err: new Error("Renewal failed") })

  //     const result = await machine.endTrial({
  //       now: trialEndDate.getTime()
  //     })

  //     expect(result.err?.message).toBe("Renewal failed")
  //   })
  // })
  })
})
