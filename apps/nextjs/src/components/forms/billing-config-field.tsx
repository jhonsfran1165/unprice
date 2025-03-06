"use client"

import { BILLING_CONFIG } from "@unprice/db/utils"
import type { BillingConfig, BillingInterval } from "@unprice/db/validators"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@unprice/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@unprice/ui/select"
import { m } from "framer-motion"
import type { FieldPath, FieldValues, PathValue, UseFormReturn } from "react-hook-form"
import { FilterScroll } from "~/components/filter-scroll"

interface FormValues extends FieldValues {
  billingConfig: BillingConfig
}

export default function BillingConfigFormField<TFieldValues extends FormValues>({
  form,
  isDisabled,
}: {
  form: UseFormReturn<TFieldValues>
  isDisabled?: boolean
}) {
  // filter dev option when node_env is production
  const options = Object.entries(BILLING_CONFIG)
    .filter(([key]) => {
      if (process.env.NODE_ENV === "production") {
        return BILLING_CONFIG[key]?.dev !== true
      }

      return true
    })
    .map(([key, value]) => ({
      label: value.label,
      value: key,
      description: value.description,
    }))

  const billingNamePath = "billingConfig.name" as const as FieldPath<TFieldValues>
  const billingName = form.watch(billingNamePath) as BillingInterval
  const optionAnchor = BILLING_CONFIG[billingName]?.billingAnchorOptions

  return (
    <>
      <FormField
        control={form.control}
        name={"billingConfig.name" as FieldPath<TFieldValues>}
        render={({ field }) => (
          <FormItem className="flex w-full flex-col">
            <FormLabel>Billing Interval</FormLabel>
            <FormDescription>
              The interval the subscription will be billed. Can be monthly, yearly, daily, etc.
            </FormDescription>
            <Select
              onValueChange={(value) => {
                const config = BILLING_CONFIG[value]
                if (!config) return

                const planTypePath = "billingConfig.planType" as FieldPath<TFieldValues>
                form.setValue(
                  planTypePath,
                  config.planType as PathValue<TFieldValues, typeof planTypePath>
                )

                const intervalCountPath =
                  "billingConfig.billingIntervalCount" as FieldPath<TFieldValues>
                form.setValue(
                  intervalCountPath,
                  config.billingIntervalCount as PathValue<TFieldValues, typeof intervalCountPath>
                )

                const intervalPath = "billingConfig.billingInterval" as FieldPath<TFieldValues>
                form.setValue(
                  intervalPath,
                  config.billingInterval as PathValue<TFieldValues, typeof intervalPath>
                )

                if (config.billingAnchorOptions.length === 0) {
                  const anchorPath = "billingConfig.billingAnchor" as FieldPath<TFieldValues>
                  form.setValue(
                    anchorPath,
                    "dayOfCreation" as PathValue<TFieldValues, typeof anchorPath>
                  )
                }

                const namePath = "billingConfig.name" as FieldPath<TFieldValues>
                form.setValue(namePath, value as PathValue<TFieldValues, typeof namePath>)
              }}
              value={field.value?.toString() ?? ""}
              disabled={isDisabled}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a billing interval" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <FilterScroll>
                  {options.map((option) => (
                    <SelectItem
                      value={option.value}
                      key={option.value}
                      description={option.description}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </FilterScroll>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      {optionAnchor && optionAnchor.length > 0 && (
        <m.div exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.6, type: "spring" }}>
          <FormField
            control={form.control}
            name={"billingConfig.billingAnchor" as FieldPath<TFieldValues>}
            render={({ field }) => (
              <FormItem className="flex w-full flex-col">
                <FormLabel>Billing Anchor</FormLabel>
                <FormDescription>Anchor specific to the billing interval.</FormDescription>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value)
                  }}
                  value={field.value?.toString() ?? "dayOfCreation"}
                  disabled={isDisabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a billing anchor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <FilterScroll>
                      {optionAnchor.map((option) => (
                        <SelectItem value={option.toString()} key={option.toString()}>
                          {option}
                        </SelectItem>
                      ))}
                    </FilterScroll>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </m.div>
      )}
    </>
  )
}
