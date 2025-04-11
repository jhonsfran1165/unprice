import { toDecimal } from "dinero.js"
import { describe, expect, it } from "vitest"
import type { Feature } from "../features"
import type { PlanVersionExtended } from "../planVersionFeatures"
import { calculateFlatPricePlan } from "./prices"

describe("calculateFlatPricePlan", () => {
  it("should calculate flat price for a plan with flat features", () => {
    const planVersion: PlanVersionExtended = {
      id: "pv_4Hs8cAjTgxCWUpFSjta8bDFEkqpF",
      currency: "USD",
      projectId: "project_4HryYvFLF7qeKUuVZtjfixTcXJ5y",
      version: 1,
      flatPrice: "0",
      planId: "plan_4HryYvFLF7qeKUuVZtjfixTcXJ5y",
      active: true,
      status: "published",
      paymentProvider: "stripe",
      collectionMethod: "charge_automatically",
      trialDays: 0,
      autoRenew: true,
      paymentMethodRequired: false,
      billingConfig: {
        name: "test",
        billingInterval: "month",
        billingIntervalCount: 1,
        planType: "recurring",
        billingAnchor: 1,
      },
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
      gracePeriod: 0,
      metadata: null,
      createdAtM: 0,
      updatedAtM: 0,
      description: "",
      latest: true,
      title: "",
      tags: [],
      publishedAt: 0,
      publishedBy: "",
      archived: false,
      archivedAt: null,
      archivedBy: null,
      dueBehaviour: "cancel",
    }

    const result = calculateFlatPricePlan({ planVersion })
    expect(result.err).toBe(undefined)
    if (result.val) {
      expect(toDecimal(result.val.dinero)).toBe("50.00")
      expect(result.val.displayAmount).toBe("$50.00")
      expect(result.val.hasUsage).toBe(false)
    }
  })
})
