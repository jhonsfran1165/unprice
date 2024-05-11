"use client"

import type { UseFormReturn } from "react-hook-form"

import type { PlanVersionFeature } from "@builderai/db/validators"

import { PriceFormField } from "./fields-form"

export function FlatFormFields({
  form,
}: {
  form: UseFormReturn<PlanVersionFeature>
}) {
  return (
    <div className="flex flex-col">
      <PriceFormField form={form} />
    </div>
  )
}
