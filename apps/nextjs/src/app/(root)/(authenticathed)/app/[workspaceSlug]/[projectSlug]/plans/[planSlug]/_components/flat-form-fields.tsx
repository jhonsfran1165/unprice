"use client"

import type { UseFormReturn } from "react-hook-form"

import type { Currency, PlanVersionFeature } from "@builderai/db/validators"

import { PriceFormField, QuantityFormField } from "./fields-form"

export function FlatFormFields({
  form,
  currency,
}: {
  form: UseFormReturn<PlanVersionFeature>
  currency: Currency
}) {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex w-full justify-between">
        <PriceFormField form={form} currency={currency} />
      </div>

      <div className="flex w-full justify-between">
        <QuantityFormField form={form} />
      </div>
    </div>
  )
}
