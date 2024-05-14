"use client"

import type { UseFormReturn } from "react-hook-form"

import type { PlanVersionFeature } from "@builderai/db/validators"

import { TierFormField } from "./fields-form"

export function TierFormFields({
  form,
}: {
  form: UseFormReturn<PlanVersionFeature>
}) {
  return (
    <div className="flex flex-col space-y-6">
      <TierFormField form={form} />
    </div>
  )
}
