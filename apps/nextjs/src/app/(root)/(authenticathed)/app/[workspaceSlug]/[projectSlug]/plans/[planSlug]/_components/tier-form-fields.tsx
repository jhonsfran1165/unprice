"use client"

import type { UseFormReturn } from "react-hook-form"

import type { PlanVersionFeature } from "@builderai/db/validators"
import { Separator } from "@builderai/ui/separator"

import { AggregationMethodFormField, TierFormField } from "./fields-form"

export function TierFormFields({
  form,
}: {
  form: UseFormReturn<PlanVersionFeature>
}) {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex justify-between">
        <div className="w-full">
          <AggregationMethodFormField form={form} />
        </div>
      </div>

      <Separator />

      <TierFormField form={form} />
    </div>
  )
}
