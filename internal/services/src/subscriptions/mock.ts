import type { Database } from "@unprice/db"
import { subscriptionPhases, subscriptions } from "@unprice/db/schema"
import type {
  Customer,
  Subscription,
  SubscriptionPhaseExtended,
  configureBillingCycleSubscription,
} from "@unprice/db/validators"
import { vi } from "vitest"

export const createMockPhase = ({
  trialDays,
  endDate,
  billingCycleStart,
  calculatedBillingCycle,
}: {
  trialDays: number
  endDate?: Date
  billingCycleStart: number
  calculatedBillingCycle: ReturnType<typeof configureBillingCycleSubscription>
}) => {
  const mockPhase: SubscriptionPhaseExtended = {
    id: "phase-1",
    subscriptionId: "sub-1",
    status: "trialing",
    projectId: "proj-1",
    planVersionId: "plan-version-1",
    billingPeriod: "month",
    planVersion: {
      id: "plan-version-1",
      planId: "plan-1",
      status: "published",
      createdAtM: Date.now(),
      updatedAtM: Date.now(),
      metadata: null,
      currency: "USD",
      projectId: "proj-1",
      description: "Test Plan",
      active: true,
      version: 1,
      latest: true,
      title: "Test Plan",
      tags: [],
      publishedAt: Date.now(),
      publishedBy: null,
      archived: null,
      archivedAt: null,
      archivedBy: null,
      paymentProvider: "stripe",
      planType: "recurring",
      billingPeriod: "month",
      whenToBill: "pay_in_advance",
      startCycle: 1,
      gracePeriod: 1,
      collectionMethod: "charge_automatically",
      trialDays,
      autoRenew: true,
      paymentMethodRequired: true,
    },
    createdAtM: Date.now(),
    updatedAtM: Date.now(),
    paymentMethodId: "",
    active: true,
    trialDays,
    gracePeriod: 1,
    dueBehaviour: "cancel",
    trialEndsAt: calculatedBillingCycle.trialDaysEndAt?.getTime() ?? null,
    whenToBill: "pay_in_advance",
    collectionMethod: "charge_automatically",
    autoRenew: true,
    startCycle: billingCycleStart,
    metadata: null,
    startAt: calculatedBillingCycle.cycleStart.getTime(),
    endAt: endDate?.getTime() ?? null,
    items: [
      {
        id: "item-1",
        featurePlanVersionId: "feature-plan-version-1",
        createdAtM: Date.now(),
        updatedAtM: Date.now(),
        projectId: "proj-1",
        units: 1,
        subscriptionPhaseId: "phase-1",
        featurePlanVersion: {
          id: "feature-plan-version-1",
          createdAtM: Date.now(),
          updatedAtM: Date.now(),
          projectId: "proj-1",
          planVersionId: "plan-version-1",
          featureId: "feature-1",
          featureType: "flat",
          config: {
            price: {
              dinero: { amount: 0, currency: { code: "USD", base: 10, exponent: 2 }, scale: 2 },
              displayAmount: "0.00",
            },
          },
          metadata: { realtime: false },
          aggregationMethod: "sum",
          order: 1024,
          defaultQuantity: 1,
          limit: null,
          hidden: true,
          feature: {
            id: "feature-1",
            createdAtM: Date.now(),
            updatedAtM: Date.now(),
            projectId: "proj-1",
            slug: "basic-access",
            code: 1,
            description: null,
            title: "Basic Access",
          },
        },
      },
      {
        id: "item-2",
        featurePlanVersionId: "feature-plan-version-2",
        createdAtM: Date.now(),
        updatedAtM: Date.now(),
        projectId: "proj-1",
        units: 15,
        subscriptionPhaseId: "phase-1",
        featurePlanVersion: {
          id: "feature-plan-version-2",
          createdAtM: Date.now(),
          updatedAtM: Date.now(),
          projectId: "proj-1",
          planVersionId: "plan-version-1",
          featureId: "ft_1CYfBGSnaFcszrKK5n8g8",
          featureType: "package",
          config: {
            price: {
              dinero: { amount: 1000, currency: { code: "USD", base: 10, exponent: 2 }, scale: 2 },
              displayAmount: "10",
            },
            units: 10,
          },
          metadata: { realtime: false },
          aggregationMethod: "sum",
          order: 2048,
          defaultQuantity: 10,
          limit: null,
          hidden: false,
          feature: {
            id: "ft_1CYfBGSnaFcszrKK5n8g8",
            createdAtM: Date.now(),
            updatedAtM: Date.now(),
            projectId: "proj-1",
            slug: "customers",
            code: 2,
            description: null,
            title: "Customers",
          },
        },
      },
      {
        id: "item-3",
        featurePlanVersionId: "feature-plan-version-3",
        createdAtM: Date.now(),
        updatedAtM: Date.now(),
        projectId: "proj-1",
        units: null,
        subscriptionPhaseId: "phase-1",
        featurePlanVersion: {
          id: "feature-plan-version-3",
          createdAtM: Date.now(),
          updatedAtM: Date.now(),
          projectId: "proj-1",
          planVersionId: "plan-version-1",
          featureId: "feature-3",
          featureType: "usage",
          config: {
            tierMode: "volume",
            usageMode: "tier",
            tiers: [
              {
                unitPrice: {
                  dinero: { amount: 0, currency: { code: "USD", base: 10, exponent: 2 }, scale: 2 },
                  displayAmount: "0.00",
                },
                flatPrice: {
                  dinero: { amount: 0, currency: { code: "USD", base: 10, exponent: 2 }, scale: 2 },
                  displayAmount: "0.00",
                },
                firstUnit: 1,
                lastUnit: 100,
              },
              {
                unitPrice: {
                  dinero: { amount: 1, currency: { code: "USD", base: 10, exponent: 2 }, scale: 2 },
                  displayAmount: "0.01",
                },
                flatPrice: {
                  dinero: { amount: 0, currency: { code: "USD", base: 10, exponent: 2 }, scale: 2 },
                  displayAmount: "0.00",
                },
                firstUnit: 101,
                lastUnit: 1000,
              },
            ],
          },
          metadata: { realtime: false },
          aggregationMethod: "sum",
          order: 3072,
          defaultQuantity: 1,
          limit: 1000,
          hidden: false,
          feature: {
            id: "feature-3",
            createdAtM: Date.now(),
            updatedAtM: Date.now(),
            projectId: "proj-1",
            slug: "api-calls",
            code: 3,
            description: null,
            title: "API Calls",
          },
        },
      },
      {
        id: "item-4",
        featurePlanVersionId: "feature-plan-version-4",
        createdAtM: Date.now(),
        updatedAtM: Date.now(),
        projectId: "proj-1",
        units: 1,
        subscriptionPhaseId: "phase-1",
        featurePlanVersion: {
          id: "feature-plan-version-4",
          createdAtM: Date.now(),
          updatedAtM: Date.now(),
          projectId: "proj-1",
          planVersionId: "plan-version-1",
          featureId: "feature-4",
          featureType: "flat",
          config: {
            price: {
              dinero: { amount: 1000, currency: { code: "USD", base: 10, exponent: 2 }, scale: 2 },
              displayAmount: "10",
            },
          },
          metadata: { realtime: false },
          aggregationMethod: "sum",
          order: 4096,
          defaultQuantity: 1,
          limit: null,
          hidden: false,
          feature: {
            id: "feature-4",
            createdAtM: Date.now(),
            updatedAtM: Date.now(),
            projectId: "proj-1",
            slug: "pro-access",
            code: 4,
            description: null,
            title: "Pro Access",
          },
        },
      },
    ],
  }

  return mockPhase
}

export const createMockSubscription = ({
  mockPhase,
  calculatedBillingCycle,
}: {
  mockPhase: SubscriptionPhaseExtended
  calculatedBillingCycle: ReturnType<typeof configureBillingCycleSubscription>
}) => {
  const nextInvoiceAt =
    mockPhase.whenToBill === "pay_in_advance"
      ? calculatedBillingCycle.cycleStart.getTime()
      : calculatedBillingCycle.cycleEnd.getTime()

  const mockSubscription: Subscription = {
    id: "sub-1",
    projectId: "proj-1",
    customerId: "cust-1",
    planSlug: "PRO",
    active: true,
    timezone: "UTC",
    createdAtM: Date.now(),
    updatedAtM: Date.now(),
    currentCycleStartAt: calculatedBillingCycle.cycleStart.getTime(),
    currentCycleEndAt: calculatedBillingCycle.cycleEnd.getTime(),
    // if there are trial days, we set the next invoice at to the end of the trial
    nextInvoiceAt:
      mockPhase.trialDays > 0 ? calculatedBillingCycle.cycleEnd.getTime() : nextInvoiceAt,
  } as Subscription

  return mockSubscription
}

export const mockCustomer: Customer = {
  id: "cust-1",
  projectId: "proj-1",
  email: "test@test.com",
  name: "Test User",
  isMain: false,
  defaultCurrency: "USD",
  timezone: "UTC",
  // this is a test stripe customer id
  stripeCustomerId: "cus_R91QP02UrOpiy9",
} as Customer

export const createMockDatabase = ({
  mockSubscription,
  mockPhase,
}: {
  mockSubscription: Subscription
  mockPhase: SubscriptionPhaseExtended
}) => {
  // Mock database operations
  const mockDb = {
    transaction: vi.fn((callback) => callback(mockDb)),
    update: vi.fn((table) => {
      if (table === subscriptions) {
        return {
          set: vi.fn((data) => ({
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
          })),
        }
      }

      if (table === subscriptionPhases) {
        return {
          set: vi.fn((data) => ({
            where: vi.fn(() => ({
              returning: vi.fn(() =>
                Promise.resolve([
                  {
                    ...mockPhase,
                    ...data,
                  },
                ])
              ),
            })),
          })),
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
    insert: vi.fn(() => {
      return {
        values: vi.fn((data) => ({
          onConflictDoUpdate: vi.fn(() => ({
            returning: vi.fn(() => Promise.resolve([data])),
          })),
        })),
      }
    }),
    query: {
      invoices: {
        findFirst: vi.fn(() => Promise.resolve(null)),
        findMany: vi.fn(() => Promise.resolve([])),
      },
      subscriptions: {
        findFirst: vi.fn(() => Promise.resolve(null)),
        findMany: vi.fn(() => Promise.resolve([])),
      },
      subscriptionPhases: {
        findFirst: vi.fn(() => Promise.resolve(null)),
        findMany: vi.fn(() => Promise.resolve([])),
      },
      customers: {
        findFirst: vi.fn(() => Promise.resolve(null)),
        findMany: vi.fn(() => Promise.resolve([])),
      },
      customerCredits: {
        findFirst: vi.fn(() => Promise.resolve(null)),
        findMany: vi.fn(() => Promise.resolve([])),
      },
    },
  } as unknown as Database

  return mockDb
}
