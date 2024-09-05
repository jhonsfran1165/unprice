"use client"
import type { InsertPlanVersion } from "@unprice/db/validators"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@unprice/ui/form"
import { Input } from "@unprice/ui/input"
import { Switch } from "@unprice/ui/switch"
import type { UseFormReturn } from "react-hook-form"

import { CURRENCIES, PAYMENT_PROVIDERS, PLAN_BILLING_PERIODS, PLAN_TYPES } from "@unprice/db/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@unprice/ui/select"
import { Textarea } from "@unprice/ui/text-area"
import { SuperLink } from "~/components/super-link"
import type { PublishedPlanVersion } from "./plan-version-form"

export function PaymentMethodRequiredFormField({
  form,
  isDisabled,
}: {
  form: UseFormReturn<InsertPlanVersion | PublishedPlanVersion>
  isDisabled?: boolean
}) {
  return (
    <FormField
      control={form.control}
      name="paymentMethodRequired"
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <FormLabel className="text-base">Payment method required</FormLabel>
            <FormDescription>
              Requiring a payment method will force customers to enter their payment method at the
              subscription checkout. This is automatically validated for paid plans.
            </FormDescription>
          </div>
          <FormControl>
            <Switch
              checked={field.value ?? false}
              onCheckedChange={field.onChange}
              disabled={isDisabled}
            />
          </FormControl>
        </FormItem>
      )}
    />
  )
}

export function TitleFormField({
  form,
  isDisabled,
}: {
  form: UseFormReturn<InsertPlanVersion | PublishedPlanVersion>
  isDisabled?: boolean
}) {
  return (
    <FormField
      control={form.control}
      disabled={isDisabled}
      name="title"
      render={({ field }) => (
        <FormItem className="flex flex-col justify-end">
          <FormLabel>Plan version Title</FormLabel>
          <FormDescription>
            This title will be displayed to your customers. You can use it for handling multiple
            languages.
          </FormDescription>
          <FormControl>
            <Input {...field} placeholder="FREE" onChange={field.onChange} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function CurrencyFormField({
  form,
  isDisabled,
}: {
  form: UseFormReturn<InsertPlanVersion | PublishedPlanVersion>
  isDisabled?: boolean
}) {
  return (
    <FormField
      control={form.control}
      disabled={isDisabled}
      name="currency"
      render={({ field }) => (
        <FormItem className="flex flex-col justify-end">
          <div className="flex justify-between">
            <FormLabel>Currency of this version</FormLabel>
            {/* // TODO: add link to currency configuration */}
            <SuperLink
              href="#"
              className="ml-auto inline-block text-info text-xs underline opacity-70"
            >
              Set default currency for this organization
            </SuperLink>
          </div>

          <FormDescription>
            You can set a different currency for each version of your plan.
          </FormDescription>
          <Select onValueChange={field.onChange} value={field.value ?? ""} disabled={isDisabled}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a currency" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {CURRENCIES.map((currency) => (
                <SelectItem key={currency} value={currency}>
                  {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function PlanTypeFormField({
  form,
  isDisabled,
}: {
  form: UseFormReturn<InsertPlanVersion | PublishedPlanVersion>
  isDisabled?: boolean
}) {
  return (
    <FormField
      control={form.control}
      name="planType"
      render={({ field }) => (
        <FormItem className="flex flex-col justify-end">
          <FormLabel>Type of the plan</FormLabel>
          <FormDescription>Only recurring plans are supported at the moment.</FormDescription>
          <Select onValueChange={field.onChange} value={field.value ?? ""} disabled={isDisabled}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a plan type" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {PLAN_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function BillingPeriodFormField({
  form,
  isDisabled,
}: {
  form: UseFormReturn<InsertPlanVersion | PublishedPlanVersion>
  isDisabled?: boolean
}) {
  return (
    <FormField
      control={form.control}
      name="billingPeriod"
      disabled={isDisabled}
      render={({ field }) => (
        <FormItem className="col-start-2 flex flex-col justify-end">
          <FormLabel>Billing period</FormLabel>
          <FormDescription>How often you want to bill customers</FormDescription>
          <Select onValueChange={field.onChange} value={field.value ?? ""} disabled={isDisabled}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a billing period" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {PLAN_BILLING_PERIODS.map((period) => (
                <SelectItem key={period} value={period}>
                  {period}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function PaymentProviderFormField({
  form,
  isDisabled,
}: {
  form: UseFormReturn<InsertPlanVersion | PublishedPlanVersion>
  isDisabled?: boolean
}) {
  return (
    <FormField
      control={form.control}
      name="paymentProvider"
      disabled={isDisabled}
      render={({ field }) => (
        <FormItem className="col-start-1 row-start-5 flex flex-col justify-end">
          <div className="flex justify-between">
            <FormLabel>Payment provider</FormLabel>
            {/* // TODO: add link to payment provider configuration */}
            <SuperLink
              href="#"
              className="ml-auto inline-block text-info text-xs underline opacity-70"
            >
              Configure payment provider
            </SuperLink>
          </div>
          <FormDescription>
            In order to use a payment provider, you need to configure it first for your
            organization.
          </FormDescription>
          <Select onValueChange={field.onChange} value={field.value ?? ""} disabled={isDisabled}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {PAYMENT_PROVIDERS.map((provider) => (
                <SelectItem key={provider} value={provider}>
                  {provider}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function DescriptionFormField({
  form,
  isDisabled,
}: {
  form: UseFormReturn<InsertPlanVersion | PublishedPlanVersion>
  isDisabled?: boolean
}) {
  return (
    <FormField
      control={form.control}
      name="description"
      render={({ field }) => (
        <FormItem className="col-start-2 row-span-2 flex flex-col justify-start">
          <FormLabel>Description</FormLabel>
          <FormDescription>Enter a short description of the versions.</FormDescription>
          <FormControl>
            <Textarea
              {...field}
              value={field.value ?? ""}
              className="md:min-h-[180px]"
              disabled={isDisabled}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
