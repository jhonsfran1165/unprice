"use client"

import type { UseFormReturn } from "react-hook-form"

import type { Currency, PlanVersionFeature } from "@builderai/db/validators"

import { PriceFormField, UnitsFormField } from "./fields-form"

export function PackageFormFields({
  form,
  currency,
}: {
  form: UseFormReturn<PlanVersionFeature>
  currency: Currency
}) {
  return (
    <div className="flex w-full flex-col gap-1">
      <PriceFormField form={form} currency={currency} />
      <UnitsFormField form={form} />
    </div>
  )
}
