"use client"
import { useCallback } from "react"

import { calculatePricePerFeature } from "@unprice/db/validators"
import type { RouterOutputs } from "@unprice/trpc/routes"
import { isZero } from "dinero.js"

type PlanVersionFeaturesResponse =
  RouterOutputs["planVersions"]["listByActiveProject"]["planVersions"][0]["planFeatures"][0]

export function PriceFeature({
  quantity,
  feature,
  type,
}: {
  feature: PlanVersionFeaturesResponse
  quantity: number
  type: "total" | "unit"
}) {
  // useCallback to prevent re-rendering calculatePricePerFeature
  const calculatePrice = useCallback(() => {
    return calculatePricePerFeature({
      featureType: feature.featureType,
      config: feature.config!,
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
        {pricePerFeature?.totalPrice.displayAmount && `${pricePerFeature.totalPrice.displayAmount}`}
      </div>
    )
  }

  // if the price is 0, don't show the price
  return (
    <>
      {!isZero(pricePerFeature.unitPrice.dinero) && (
        <div className="inline text-muted-foreground text-xs italic">
          {pricePerFeature.unitPrice.displayAmount && `${pricePerFeature.unitPrice.displayAmount}`}
        </div>
      )}
    </>
  )
}
