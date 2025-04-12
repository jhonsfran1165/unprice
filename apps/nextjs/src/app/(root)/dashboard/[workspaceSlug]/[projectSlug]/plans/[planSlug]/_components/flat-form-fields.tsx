"use client"

import type { UseFormReturn } from "react-hook-form"

import type { Currency, PlanVersionFeatureInsert } from "@unprice/db/validators"

import { PriceFormField } from "./fields-form"

export function FlatFormFields({
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
        <PriceFormField form={form} currency={currency} isDisabled={isDisabled} />
      </div>
    </div>
  )
}
