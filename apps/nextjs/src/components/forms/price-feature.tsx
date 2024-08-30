"use client"
import { useCallback } from "react"

import type { RouterOutputs } from "@unprice/api"
import { calculatePricePerFeature } from "@unprice/db/validators"
import { isZero } from "dinero.js"

type PlanVersionResponse = RouterOutputs["planVersions"]["listByUnpriceProject"]["planVersions"][0]

type PlanVersionFeaturesResponse =
  RouterOutputs["planVersions"]["listByUnpriceProject"]["planVersions"][0]["planFeatures"][0]

export function PriceFeature({
  selectedPlanVersion,
  quantity,
  feature,
  type,
}: {
  selectedPlanVersion: PlanVersionResponse
  feature: PlanVersionFeaturesResponse
  quantity: number
  type: "total" | "unit"
}) {
  // useCallback to prevent re-rendering calculatePricePerFeature
  const calculatePrice = useCallback(() => {
    return calculatePricePerFeature({
      feature: feature,
      quantity: quantity,
    })
  }, [feature, quantity])

  const { err, val: pricePerFeature } = calculatePrice()

  if (err) {
    return <div className="inline text-danger text-xs italic">provide quantity</div>
  }

  if (type === "total") {
    return (
      <div className="inline text-end text-xs">
        {pricePerFeature?.totalPrice.displayAmount &&
          `${pricePerFeature.totalPrice.displayAmount}/ ${selectedPlanVersion.billingPeriod}`}
      </div>
    )
  }

  // if the price is 0, don't show the price
  return (
    <>
      {!isZero(pricePerFeature.unitPrice.dinero) && (
        <div className="inline text-muted-foreground text-xs italic">
          {pricePerFeature.unitPrice.displayAmount &&
            `${pricePerFeature.unitPrice.displayAmount}/ ${selectedPlanVersion?.billingPeriod}`}
        </div>
      )}
    </>
  )
}
