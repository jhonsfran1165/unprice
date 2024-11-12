import { type Database } from "@unprice/db"
import { configureBillingCycleSubscription, Subscription, SubscriptionPhaseExtended } from "@unprice/db/validators"
import { type Logger } from "@unprice/logging"
import { type Analytics } from "@unprice/tinybird"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { PaymentProviderService } from "../payment-provider"
import { SubscriptionStateMachine } from "./machine"
import { createMockDatabase, createMockPhase, createMockSubscription, mockCustomer } from "./mock"

describe("SubscriptionStateMachine", () => {
  let machine: SubscriptionStateMachine
  let mockDb: Database
  let mockAnalytics: Analytics
  let mockLogger: Logger
  let mockPhase: SubscriptionPhaseExtended
  let mockSubscription: Subscription

  const startDate = new Date("2024-01-01T00:00:00Z")
  const endDate = new Date("2024-01-31T23:59:59.999Z")
  const billingPeriod = "month"
  const trialDays = 15
  const billingCycleStart = 1

  const calculatedBillingCycle = configureBillingCycleSubscription({
    currentCycleStartAt: startDate.getTime(),
    trialDays,
    billingCycleStart,
    billingPeriod,
    endAt: endDate.getTime(),
  })

  beforeEach(() => {

    // Mock analytics
    mockAnalytics = {
      getTotalUsagePerFeature: vi.fn((input) => {
        const result = {
          sum: 0,
          max: 0,
          count: 0,
          last_during_period: 0
        }

        if (input.parameters.featureSlug === "api-calls") {
          result.sum = 100
          result.max = 100
          result.count = 100
          result.last_during_period = 100
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
      endDate,
    })

     mockSubscription = createMockSubscription({
      mockPhase,
      calculatedBillingCycle,
    })


    machine = new SubscriptionStateMachine({
      db: mockDb,
      activePhase: mockPhase,
      subscription: mockSubscription,
      customer: mockCustomer,
      logger: mockLogger,
      analytics: mockAnalytics,
      isTest: true,
    })

    mockDb = createMockDatabase({
      mockSubscription,
      mockPhase,
    })

  })

  describe("endTrial", () => {
    it("should not end trial before trial end date", async () => {
      const tooEarly = new Date("2024-01-10T00:00:00Z").getTime()
      const result = await machine.endTrial({ now: tooEarly })

      expect(result.err?.message).toBe("Subscription service error: Trial has not ended yet")
    })

    it("should validate invoice date", async () => {
      const result = await machine.endTrial({ now: calculatedBillingCycle.trialDaysEndAt!.getTime() })

      expect(result.err?.message).toBe("Subscription service error: Subscription is not ready to be invoiced")
    })

    it("should successfully end trial on trial end date", async () => {
      const result = await machine.endTrial({
        // right after the trial ends
        now: calculatedBillingCycle.trialDaysEndAt!.getTime() + 1
      })

      console.log("result", result)

      expect(result.err).toBeUndefined()
      expect(result.val?.status).toBe("active")
      // invoice from payment provider should be set
      expect(result.val?.paymentInvoiceId).toBeDefined()

      const paymentProviderService = new PaymentProviderService({
        customer: mockCustomer,
        paymentProviderId: mockPhase.planVersion.paymentProvider,
        logger: mockLogger,
      })

      // TODO: get the invoice data and check the totals
      const invoice = await paymentProviderService.getInvoice({ invoiceId: result.val?.paymentInvoiceId! })

      // invoice should be paid
      expect(invoice.val?.status).toBe("paid")
      // invoice should have the correct amount
      expect(invoice.val?.total).toBe(result.val?.total)
    }, { timeout: 10000 })

    it("should handle trial end with pay in arrear billing and payment method validation", async () => {
      // override the phase and subscription
      // change to pay in arrear
      mockPhase.whenToBill = "pay_in_arrear"

      mockSubscription = createMockSubscription({
        mockPhase,
        calculatedBillingCycle,
      })

      mockDb = createMockDatabase({
        mockSubscription,
        mockPhase,
      })

      machine = new SubscriptionStateMachine({
        db: mockDb,
        activePhase: mockPhase,
        subscription: mockSubscription,
        customer: {
          ...mockCustomer,
          // test stripe customer id with no payment method
          stripeCustomerId: "cus_Qez3LjpCJFB7LD",
        },
        logger: mockLogger,
        analytics: mockAnalytics,
        isTest: true,
      })


      const result = await machine.endTrial({
        now: calculatedBillingCycle.trialDaysEndAt?.getTime() ?? 0
      })

      expect(result.err?.message).toBe("Subscription service error: Error getting default payment method: Payment provider error: No payment methods found")
    })

    it("should handle trial end with pay in arrear billing", async () => {
      // override the phase and subscription
      // change to pay in arrear
      mockPhase.whenToBill = "pay_in_arrear"

      mockSubscription = createMockSubscription({
        mockPhase,
        calculatedBillingCycle,
      })

      mockDb = createMockDatabase({
        mockSubscription,
        mockPhase,
      })

      machine = new SubscriptionStateMachine({
        db: mockDb,
        activePhase: mockPhase,
        subscription: mockSubscription,
        customer: mockCustomer,
        logger: mockLogger,
        analytics: mockAnalytics,
        isTest: true,
      })


      const result = await machine.endTrial({
        now: calculatedBillingCycle.trialDaysEndAt?.getTime() ?? 0
      })

      const alteredSubscription = machine.getSubscription()
      const alteredPhase = machine.getActivePhase()

      expect(result.err).toBeUndefined()
      expect(result.val?.status).toBe("active")
      expect(alteredSubscription.status).toBe("active")
      // invoice data should be at the end of the cycle
      expect(alteredSubscription.nextInvoiceAt).toEqual(alteredSubscription.currentCycleEndAt)
      // should be pay in arrear
      expect(alteredPhase.whenToBill).toBe("pay_in_arrear")
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
