"use client"

import type { UseFormReturn } from "react-hook-form"

import type { Currency, PlanVersionFeature } from "@unprice/db/validators"
import { Separator } from "@unprice/ui/separator"

import { LimitFormField, QuantityFormField, TierFormField } from "./fields-form"

export function TierFormFields({
  form,
  currency,
  isDisabled,
}: {
  form: UseFormReturn<PlanVersionFeature>
  currency: Currency
  isDisabled?: boolean
}) {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex w-full justify-between">
        <QuantityFormField form={form} isDisabled={isDisabled} />
      </div>

      <Separator />

      <div className="flex flex-col space-y-6">
        <LimitFormField form={form} isDisabled={isDisabled} />
      </div>

      <Separator />

      <div className="flex flex-col space-y-6">
        <TierFormField form={form} currency={currency} isDisabled={isDisabled} />
      </div>
    </div>
  )
}
