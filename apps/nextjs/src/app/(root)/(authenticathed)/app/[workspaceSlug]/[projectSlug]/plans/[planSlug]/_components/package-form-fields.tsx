"use client"

import type { UseFormReturn } from "react-hook-form"

import type { Currency, PlanVersionFeature } from "@builderai/db/validators"
import { Separator } from "@builderai/ui/separator"

import {
  PriceFormField,
  QuantityFormField,
  UnitsFormField,
} from "./fields-form"

export function PackageFormFields({
  form,
  currency,
}: {
  form: UseFormReturn<PlanVersionFeature>
  currency: Currency
}) {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex w-full justify-between">
        <QuantityFormField form={form} />
      </div>

      <Separator />

      <div className="flex w-full flex-col gap-1">
        <PriceFormField form={form} currency={currency} />
        <UnitsFormField form={form} />
      </div>
    </div>
  )
}
