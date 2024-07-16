"use client"

import type { UseFormReturn } from "react-hook-form"

import type { Currency, PlanVersionFeature } from "@builderai/db/validators"
import { Separator } from "@builderai/ui/separator"

import {
  AggregationMethodFormField,
  LimitFormField,
  PriceFormField,
  TierFormField,
  UnitsFormField,
} from "./fields-form"

export function UsageFormFields({
  form,
  currency,
}: {
  form: UseFormReturn<PlanVersionFeature>
  currency: Currency
}) {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex w-full justify-between">
        <AggregationMethodFormField form={form} />
      </div>

      <Separator />

      <div className="flex w-full justify-between">
        <LimitFormField form={form} />
      </div>

      <Separator />

      {form.getValues("config.usageMode") === "unit" && (
        <div className="flex w-full justify-between">
          <PriceFormField form={form} currency={currency} />
        </div>
      )}

      {form.getValues("config.usageMode") === "tier" && (
        <div className="flex w-full justify-between">
          <TierFormField form={form} currency={currency} />
        </div>
      )}

      {form.getValues("config.usageMode") === "package" && (
        <div className="flex w-full justify-between">
          <div className="flex w-full flex-col gap-1">
            <PriceFormField form={form} currency={currency} />
            <UnitsFormField form={form} />
          </div>
        </div>
      )}
    </div>
  )
}
