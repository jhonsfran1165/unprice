"use client"

import type { UseFormReturn } from "react-hook-form"

import type { PlanVersionFeature } from "@builderai/db/validators"

import { AggregationMethodFormField, PriceFormField } from "./fields-form"

export function UsageFormFields({
  form,
}: {
  form: UseFormReturn<PlanVersionFeature>
}) {
  return (
    <div className="flex flex-col space-y-6">
      {form.getValues("config.usageMode") === "unit" && (
        <div className="flex w-full justify-between">
          <PriceFormField form={form} />
        </div>
      )}

      <div className="flex w-full justify-between">
        <AggregationMethodFormField form={form} />
      </div>
    </div>
  )
}
