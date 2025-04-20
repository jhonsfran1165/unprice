"use client"

import type { UseFormReturn } from "react-hook-form"

import type { Currency, PlanVersionFeatureInsert } from "@unprice/db/validators"
import { Separator } from "@unprice/ui/separator"

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
  isDisabled,
}: {
  form: UseFormReturn<PlanVersionFeatureInsert>
  currency: Currency
  isDisabled?: boolean
}) {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex w-full justify-between">
        <AggregationMethodFormField form={form} isDisabled={isDisabled} />
      </div>

      <Separator />

      <div className="flex w-full justify-between">
        <LimitFormField form={form} isDisabled={isDisabled} />
      </div>

      <Separator />

      {form.getValues("config.usageMode") === "unit" && (
        <div className="flex w-full justify-between">
          <PriceFormField form={form} currency={currency} isDisabled={isDisabled} />
        </div>
      )}

      {form.getValues("config.usageMode") === "tier" && (
        <div className="flex w-full justify-between">
          <TierFormField form={form} currency={currency} isDisabled={isDisabled} />
        </div>
      )}

      {form.getValues("config.usageMode") === "package" && (
        <div className="flex w-full justify-between">
          <div className="flex w-full flex-col gap-1">
            <PriceFormField form={form} currency={currency} isDisabled={isDisabled} />
            <UnitsFormField form={form} isDisabled={isDisabled} />
          </div>
        </div>
      )}
    </div>
  )
}
