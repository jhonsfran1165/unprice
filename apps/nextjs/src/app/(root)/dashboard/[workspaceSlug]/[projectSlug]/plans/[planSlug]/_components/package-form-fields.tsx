"use client"

import type { UseFormReturn } from "react-hook-form"

import type { Currency, PlanVersionFeatureInsert } from "@unprice/db/validators"

import { Separator } from "@unprice/ui/separator"
import { PriceFormField, QuantityFormField, UnitsFormField } from "./fields-form"

export function PackageFormFields({
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
      <div className="flex w-full flex-col gap-1">
        <PriceFormField form={form} currency={currency} isDisabled={isDisabled} />
        <UnitsFormField form={form} isDisabled={isDisabled} />
      </div>

      <Separator />

      <div className="flex w-full justify-between">
        <QuantityFormField form={form} isDisabled={isDisabled} />
      </div>
    </div>
  )
}
