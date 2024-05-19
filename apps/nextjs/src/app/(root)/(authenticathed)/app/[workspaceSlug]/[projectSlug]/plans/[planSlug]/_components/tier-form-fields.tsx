"use client"

import type { UseFormReturn } from "react-hook-form"

import type { PlanVersionFeature } from "@builderai/db/validators"
import { Separator } from "@builderai/ui/separator"

import { LimitFormField, QuantityFormField, TierFormField } from "./fields-form"

export function TierFormFields({
  form,
}: {
  form: UseFormReturn<PlanVersionFeature>
}) {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex w-full justify-between">
        <QuantityFormField form={form} />
      </div>

      <Separator />

      <div className="flex flex-col space-y-6">
        <LimitFormField form={form} />
      </div>

      <Separator />

      <div className="flex flex-col space-y-6">
        <TierFormField form={form} />
      </div>
    </div>
  )
}
