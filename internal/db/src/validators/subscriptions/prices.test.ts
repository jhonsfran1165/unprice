import { toDecimal } from "dinero.js"
import { describe, expect, it } from "vitest"
import type { Feature } from "../features"
import type { PlanVersionExtended } from "../planVersionFeatures"
import type { Plan } from "../plans"
import { calculateFlatPricePlan } from "./prices"

describe("calculateFlatPricePlan", () => {
  it("should calculate flat price for a plan with flat features", () => {
    const planVersion = {
      id: "pv_4Hs8cAjTgxCWUpFSjta8bDFEkqpF",
      currency: "USD",
      plan: {
        slug: "free-plan",
        defaultPlan: true,
        enterprisePlan: false,
        id: "plan_4HryYvFLF7qeKUuVZtjfixTcXJ5y",
      } as Plan,
      planId: "plan_4HryYvFLF7qeKUuVZtjfixTcXJ5y",
      active: true,
      status: "published",
      paymentProvider: "stripe",
      billingInterval: "month",
      billingIntervalCount: 1,
      billingAnchor: 1,
      planType: "recurring",
      planFeatures: [
        {
          id: "fv_4HsTVDfaaTtnAkq5sKB1Raj4tgaG",
          featureType: "flat",
          config: {
            price: {
              dinero: {
                amount: 3000,
                currency: {
                  code: "USD",
                  base: 10,
                  exponent: 2,
                },
                scale: 2,
              },
              displayAmount: "30.00",
            },
          },
          metadata: {
            realtime: false,
          },
          aggregationMethod: "sum",
          defaultQuantity: 1,
          limit: null,
          createdAtM: 0,
          updatedAtM: 0,
          projectId: "",
          planVersionId: "",
          featureId: "",
          order: 0,
          hidden: false,
          feature: {
            id: "feature_4HryYvFLF7qeKUuVZtjfixTcXJ5y",
            slug: "feature-1",
          } as Feature,
        },
        {
          id: "fv_4HsTVDfaaTtnAkq5sKB1Raj4tg23G",
          featureType: "flat",
          config: {
            price: {
              dinero: {
                amount: 2000,
                currency: {
                  code: "USD",
                  base: 10,
                  exponent: 2,
                },
                scale: 2,
              },
              displayAmount: "20.00",
            },
          },
          metadata: {
            realtime: false,
          },
          aggregationMethod: "sum",
          defaultQuantity: 1,
          limit: null,
          createdAtM: 0,
          updatedAtM: 0,
          projectId: "",
          planVersionId: "",
          featureId: "",
          order: 0,
          hidden: false,
          feature: {
            id: "feature_4HryYvFLF7qeKUuVZtjfixTcXJ5y",
            slug: "feature-2",
          } as Feature,
        },
      ],
      whenToBill: "pay_in_advance",
      gracePeriod: null,
      metadata: null,
    } as PlanVersionExtended

    const result = calculateFlatPricePlan({ planVersion })
    expect(result.err).toBe(undefined)
    if (result.val) {
      expect(toDecimal(result.val.dinero)).toBe("50.00")
      expect(result.val.displayAmount).toBe("$50.00")
      expect(result.val.hasUsage).toBe(false)
    }
  })
})
