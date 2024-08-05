"use client"

import type { RouterOutputs } from "@unprice/api"
import { FEATURE_TYPES_MAPS, TIER_MODES_MAP, USAGE_MODES_MAP } from "@unprice/db/utils"
import { calculatePricePerFeature } from "@unprice/db/validators"
import { CheckIcon, HelpCircle } from "@unprice/ui/icons"
import { Slider } from "@unprice/ui/slider"
import { Tooltip, TooltipContent, TooltipTrigger } from "@unprice/ui/tooltip"
import { Typography } from "@unprice/ui/typography"
import { isZero } from "dinero.js"
import { useMemo, useState } from "react"
import { useDebounce } from "~/hooks/use-debounce"
import { nFormatter } from "~/lib/nformatter"

export function ItemPriceCard({
  feature,
  withCalculator,
}: {
  feature: RouterOutputs["planVersions"]["getById"]["planVersion"]["planFeatures"][number]
  withCalculator?: boolean
}) {
  const defaultQuantity = feature.defaultQuantity ?? 1
  const [quantity, setQuantity] = useState<number>(defaultQuantity)
  const quantityDebounce = useDebounce(quantity, 100)

  const { err, val: pricePerFeature } = useMemo(
    () =>
      calculatePricePerFeature({
        feature: feature,
        quantity: quantityDebounce,
      }),
    [quantityDebounce]
  )

  if (err) {
    return (
      <div className="inline text-muted-foreground text-xs italic">error calculating price</div>
    )
  }

  return (
    <div className="flex flex-row items-center gap-1">
      <div className="flex justify-start">
        <CheckIcon className="mr-2 h-5 w-5 text-success" />
      </div>
      <div className="flex w-full flex-col items-center gap-1">
        <div className="flex w-full flex-col justify-start">
          <div className="flex items-center gap-2 font-medium">
            <span className="text-sm">
              {nFormatter(defaultQuantity)} {feature.feature.slug}
            </span>

            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 font-light" />
              </TooltipTrigger>
              <TooltipContent align="start" side="right" sideOffset={10} alignOffset={-5}>
                <div className="flex w-[300px] flex-col gap-2 p-2">
                  <Typography variant="h6">
                    Feature type {feature.featureType} {feature.config?.usageMode} *
                  </Typography>

                  <Typography variant="p" affects="removePaddingMargin">
                    {feature.feature.description}
                  </Typography>

                  <Typography
                    variant="p"
                    affects="removePaddingMargin"
                    className="font-light text-xs italic"
                  >
                    {feature.featureType &&
                      `* ${FEATURE_TYPES_MAPS[feature.featureType].description}`}{" "}
                    {feature.featureType && <br />}
                    {feature.config?.tierMode &&
                      `* ${TIER_MODES_MAP[feature.config.tierMode].description}`}{" "}
                    {feature.config?.tierMode && <br />}
                    {feature.config?.usageMode &&
                      `* ${USAGE_MODES_MAP[feature.config.usageMode].description}`}{" "}
                    {feature.config?.usageMode && <br />}
                  </Typography>

                  {feature.limit && (
                    <span className="text-sm">
                      {`Up to ${nFormatter(feature.limit)} ${feature.feature.slug}`}
                    </span>
                  )}

                  {withCalculator && ["usage", "tier"].includes(feature.featureType) && (
                    <>
                      <div className="text-xs">
                        Price Calculator: Total price per {nFormatter(quantity)}{" "}
                        {feature.feature.slug} is {pricePerFeature.totalPrice.displayAmount}
                      </div>
                      <Slider
                        max={feature.limit ?? defaultQuantity * 10 ?? 1000}
                        min={1}
                        step={1}
                        size="sm"
                        className="my-2"
                        defaultValue={[quantityDebounce]}
                        onValueChange={([sliderValue]) => setQuantity(sliderValue ?? 1)}
                      />
                    </>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </div>

          {!isZero(pricePerFeature.unitPrice.dinero) && (
            <div className="text-xs">{pricePerFeature.unitPrice.displayAmount}</div>
          )}
        </div>
      </div>
    </div>
  )
}
