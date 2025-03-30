import type { Database } from "@unprice/db"
import { invoices, subscriptions } from "@unprice/db/schema"
import type { Customer, Subscription, SubscriptionPhaseExtended } from "@unprice/db/validators"
import { Ok } from "@unprice/error"
import type { ConsoleLogger } from "@unprice/logging"
import type { Analytics } from "@unprice/tinybird"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { db } from "../utils/db"
import { SubscriptionMachine } from "./machine"

// Mock environment variables
vi.mock("../../env", () => ({
  env: {
    ENCRYPTION_KEY: "test_encryption_key",
  },
}))

// Mock only AesGCM class
vi.mock("@unprice/db/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@unprice/db/utils")>()
  return {
    ...actual,
    AesGCM: {
      withBase64Key: vi.fn().mockResolvedValue({
        decrypt: vi.fn().mockResolvedValue("test_decrypted_key"),
      }),
    },
  }
})

// Mock PaymentProviderService
vi.mock("../payment-provider", () => ({
  PaymentProviderService: vi.fn().mockImplementation(() => ({
    getDefaultPaymentMethodId: vi.fn().mockResolvedValue(Ok({ paymentMethodId: "pm_123" })),
    createInvoice: vi.fn().mockResolvedValue(
      Ok({
        invoiceId: "inv_123",
        invoiceUrl: "https://example.com/invoice",
      })
    ),
    addInvoiceItem: vi.fn().mockResolvedValue(
      Ok({
        itemId: "item_123",
      })
    ),
    formatAmount: vi.fn().mockReturnValue(Ok({ amount: 1000 })),
  })),
}))

describe("SubscriptionMachine", () => {
  let mockAnalytics: Analytics
  let mockLogger: ConsoleLogger
  let mockSubscription: Subscription & { phases: SubscriptionPhaseExtended[]; customer: Customer }
  let mockDb: Database
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  let dbMockData: Record<string, any>[] = []

  beforeEach(() => {
    // Reset mocks and tracking arrays
    vi.clearAllMocks()
    dbMockData = []

    // Mock analytics
    mockAnalytics = {
      getBillingUsage: vi.fn().mockResolvedValue({
        data: [
          {
            flat_all: 10,
            tier_all: 20,
            package_all: 30,
          },
        ],
      }),
    } as unknown as Analytics

    // Mock logger
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
    } as unknown as ConsoleLogger

    // Mock subscription data with all required relations
    mockSubscription = {
      id: "sub_123",
      projectId: "proj_123",
      customerId: "cust_123",
      status: "trialing",
      active: true,
      trialEndsAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
      currentPhase: {
        id: "phase_123",
        trialDays: 30,
        trialEndsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      paymentMethodId: "pm_123",
      // Add required relations
      phases: [
        {
          id: "phase_123",
          startAt: Date.now() - 48 * 60 * 60 * 1000, // Started in the past
          endAt: null,
          trialDays: 1,
          // trialEndsAt is set to a past date to simulate a trial that has ended
          trialEndsAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          planVersion: {
            id: "plan_v_123",
            paymentProvider: "stripe",
            paymentMethodRequired: true,
            whenToBill: "pay_in_advance",
            currency: "usd",
            collectionMethod: "charge_automatically",
            gracePeriod: 3,
            autoRenew: false,
            billingConfig: {
              billingInterval: "month",
              billingIntervalCount: 1,
              planType: "recurring",
              billingAnchor: 1,
            },
          },
          items: [
            {
              id: "item_123",
              units: 1,
              featurePlanVersion: {
                id: "fpv_123",
                featureType: "flat",
                feature: {
                  id: "feature_123",
                  slug: "test-feature",
                  title: "Test Feature",
                },
                aggregationMethod: "sum",
                config: {
                  units: 1,
                },
              },
            },
          ],
        },
      ],
      customer: {
        id: "cust_123",
        name: "Test Customer",
        email: "test@example.com",
        projectId: "proj_123",
        paymentMethods: [
          {
            id: "pm_123",
            provider: "stripe",
            isDefault: true,
          },
        ],
      },
      currentCycleStartAt: Date.now(),
      currentCycleEndAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      invoiceAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    } as unknown as Subscription & { phases: SubscriptionPhaseExtended[]; customer: Customer }

    // save the mockSubscription to the dbMockData
    dbMockData.push({ table: "subscriptions", data: mockSubscription })

    // Mock db operations
    mockDb = {
      transaction: vi.fn().mockImplementation((callback) => callback(mockDb)),
      update: vi.fn((table) => {
        // print keys of the table
        if (table === subscriptions) {
          return {
            set: vi.fn((data) => {
              // get index of the current data
              const index = dbMockData.findIndex((item) => item.table === "subscriptions")

              if (index !== -1) {
                // update the data and update the dbMockData in place
                dbMockData[index] = {
                  table: "subscriptions",
                  data: {
                    ...dbMockData[index]!.data,
                    ...data,
                  },
                }
              }

              return {
                where: vi.fn(() => ({
                  returning: vi.fn(() => {
                    return Promise.resolve([
                      {
                        ...mockSubscription,
                        ...data,
                      },
                    ])
                  }),
                })),
              }
            }),
          }
        }

        if (table === invoices) {
          return {
            set: vi.fn((data) => {
              const currentData = dbMockData.find((item) => item.table === "invoices")
              if (currentData) {
                currentData.data = {
                  ...currentData.data,
                  ...data,
                }
              } else {
                dbMockData.push({ table: "invoices", data })
              }

              return {
                where: vi.fn(() => ({
                  returning: vi.fn(() =>
                    Promise.resolve([
                      {
                        ...data,
                      },
                    ])
                  ),
                })),
              }
            }),
          }
        }

        return {
          set: vi.fn((data) => ({
            where: vi.fn(() => ({
              returning: vi.fn(() => Promise.resolve([data])),
            })),
          })),
        }
      }),
      query: {
        subscriptions: {
          findFirst: vi.fn().mockResolvedValue(mockSubscription),
        },
        paymentProviderConfig: {
          findFirst: vi.fn().mockResolvedValue({
            id: "config_123",
            projectId: "proj_123",
            paymentProvider: "stripe",
            active: true,
            keyIv: "test_iv",
            key: "test_encrypted_key",
          }),
        },
      },
      insert: vi.fn(() => {
        return {
          values: vi.fn((data) => {
            dbMockData.push({ table: "invoices", data })

            return {
              returning: vi.fn().mockResolvedValue([
                {
                  id: "inv_123",
                  status: "draft",
                  subscriptionId: mockSubscription.id,
                  subscriptionPhaseId: mockSubscription.phases[0]!.id,
                  cycleStartAt: mockSubscription.currentCycleStartAt,
                  cycleEndAt: mockSubscription.currentCycleEndAt,
                  ...data,
                },
              ]),
            }
          }),
        }
      }),
    } as unknown as Database

    // Replace the real db with our mock
    vi.spyOn(db, "transaction").mockImplementation((callback) => mockDb.transaction(callback))
    vi.spyOn(db, "update").mockImplementation(mockDb.update)
    vi.spyOn(db, "query", "get").mockReturnValue(mockDb.query)
    vi.spyOn(db, "insert").mockImplementation(mockDb.insert)
  })

  it("should transition from trialing to expired when trial ends and auto renew disabled", async () => {
    // Create the machine
    const result = await SubscriptionMachine.create({
      subscriptionId: mockSubscription.id,
      projectId: mockSubscription.projectId,
      analytics: mockAnalytics,
      logger: mockLogger,
      now: Date.now(),
      waitUntil: vi.fn(),
    })

    expect(result.err).toBeUndefined()
    if (result.err) return

    const subscriptionMachine = result.val

    // Initial state should be trialing
    expect(subscriptionMachine.getState()).toBe("trialing")

    // Trigger trial end
    const trialEndResult = await subscriptionMachine.endTrial()

    expect(trialEndResult.err).toBeUndefined()
    if (trialEndResult.err) return

    // Initial state should be invoiced
    expect(subscriptionMachine.getState()).toBe("invoiced")

    // Verify invoice creation
    const invoiceInsert = dbMockData.find((insert) => insert.table === "invoices")
    expect(invoiceInsert).toBeDefined()
    expect(invoiceInsert?.data).toMatchObject({
      subscriptionId: mockSubscription.id,
      subscriptionPhaseId: mockSubscription.phases[0]!.id,
      status: "draft",
      type: "flat",
      whenToBill: "pay_in_advance",
      paymentProvider: "stripe",
      currency: "usd",
      collectionMethod: "charge_automatically",
    })

    // renew the subscription
    const renewResult = await subscriptionMachine.renew()

    expect(renewResult.err).toBeUndefined()
    if (renewResult.err) return

    // Should transition to expired state
    expect(subscriptionMachine.getState()).toBe("expired")

    // Verify subscription updates
    const subscriptionUpdates = dbMockData
      .filter((update) => update.table === "subscriptions")
      .map((update) => update.data)[0]

    expect(subscriptionUpdates).toMatchObject({
      status: "expired",
      active: false,
    })

    // Clean up
    await subscriptionMachine.shutdown()
  })

  it("should transition from trialing to active when trial ends and auto renew enabled", async () => {
    // mock the subscription to have auto renew enabled
    mockSubscription.phases[0]!.planVersion.autoRenew = true

    // Create the machine
    const result = await SubscriptionMachine.create({
      subscriptionId: mockSubscription.id,
      projectId: mockSubscription.projectId,
      analytics: mockAnalytics,
      logger: mockLogger,
      now: Date.now(),
      waitUntil: vi.fn(),
    })

    expect(result.err).toBeUndefined()
    if (result.err) return

    const subscriptionMachine = result.val

    // Initial state should be trialing
    expect(subscriptionMachine.getState()).toBe("trialing")

    // Trigger trial end
    const trialEndResult = await subscriptionMachine.endTrial()

    expect(trialEndResult.err).toBeUndefined()
    if (trialEndResult.err) return

    // Initial state should be invoiced
    expect(subscriptionMachine.getState()).toBe("invoiced")

    // Verify invoice creation
    const invoiceInsert = dbMockData.find((insert) => insert.table === "invoices")
    expect(invoiceInsert).toBeDefined()
    expect(invoiceInsert?.data).toMatchObject({
      subscriptionId: mockSubscription.id,
      subscriptionPhaseId: mockSubscription.phases[0]!.id,
      status: "draft",
      type: "flat",
      whenToBill: "pay_in_advance",
      paymentProvider: "stripe",
      currency: "usd",
      collectionMethod: "charge_automatically",
    })

    // renew the subscription
    const renewResult = await subscriptionMachine.renew()

    expect(renewResult.err).toBeUndefined()
    if (renewResult.err) return

    // Should transition to expired state
    expect(subscriptionMachine.getState()).toBe("active")

    // Verify subscription updates
    const subscriptionUpdates = dbMockData
      .filter((update) => update.table === "subscriptions")
      .map((update) => update.data)[0]

    expect(subscriptionUpdates).toMatchObject({
      status: "active",
      active: true,
    })

    // Clean up
    await subscriptionMachine.shutdown()
  })
})
