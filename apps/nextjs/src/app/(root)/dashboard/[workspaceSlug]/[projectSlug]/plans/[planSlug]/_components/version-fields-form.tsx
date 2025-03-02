"use client"
import type { Currency, PaymentProvider } from "@unprice/db/validators"
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
import type { FieldPath, FieldValues, UseFormReturn } from "react-hook-form"

import { CURRENCIES, PAYMENT_PROVIDERS } from "@unprice/db/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@unprice/ui/select"
import { Textarea } from "@unprice/ui/text-area"
import { useParams } from "next/navigation"
import { SuperLink } from "~/components/super-link"

interface FormValues extends FieldValues {
  paymentMethodRequired: boolean
  title: string
  currency: Currency
  paymentProvider: PaymentProvider
  description: string
  trialDays: number
}

export function PaymentMethodRequiredFormField<TFieldValues extends FormValues>({
  form,
  isDisabled,
}: {
  form: UseFormReturn<TFieldValues>
  isDisabled?: boolean
}) {
  return (
    <FormField
      control={form.control}
      name={"paymentMethodRequired" as FieldPath<TFieldValues>}
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
              onCheckedChange={(value) => {
                field.onChange(value)
              }}
              disabled={isDisabled}
            />
          </FormControl>
        </FormItem>
      )}
    />
  )
}

export function TitleFormField<TFieldValues extends FormValues>({
  form,
  isDisabled,
}: {
  form: UseFormReturn<TFieldValues>
  isDisabled?: boolean
}) {
  return (
    <FormField
      control={form.control}
      name={"title" as FieldPath<TFieldValues>}
      render={({ field }) => (
        <FormItem className="flex flex-col justify-end">
          <FormLabel>Plan version Title</FormLabel>
          <FormDescription>
            This title will be displayed to your customers. You can use it for handling multiple
            languages.
          </FormDescription>
          <FormControl>
            <Input {...field} placeholder="FREE" onChange={field.onChange} disabled={isDisabled} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function CurrencyFormField<TFieldValues extends FormValues>({
  form,
  isDisabled,
}: {
  form: UseFormReturn<TFieldValues>
  isDisabled?: boolean
}) {
  const { workspaceSlug, projectSlug } = useParams()

  return (
    <FormField
      control={form.control}
      name={"currency" as FieldPath<TFieldValues>}
      render={({ field }) => (
        <FormItem className="flex flex-col justify-end">
          <div className="flex justify-between">
            <FormLabel>Currency of this version</FormLabel>
            <SuperLink
              href={`/${workspaceSlug}/${projectSlug}/settings`}
              className="ml-auto inline-block text-info text-xs underline opacity-70"
            >
              Set default currency for this app
            </SuperLink>
          </div>

          <FormDescription>
            You can set a different currency for each version of your plan.
          </FormDescription>
          <Select onValueChange={field.onChange} value={field.value} disabled={isDisabled}>
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

export function PaymentProviderFormField<TFieldValues extends FormValues>({
  form,
  isDisabled,
  workspaceSlug,
  projectSlug,
}: {
  form: UseFormReturn<TFieldValues>
  isDisabled?: boolean
  workspaceSlug: string
  projectSlug: string
}) {
  return (
    <FormField
      control={form.control}
      name={"paymentProvider" as FieldPath<TFieldValues>}
      render={({ field }) => (
        <FormItem className="col-start-1 row-start-5 flex flex-col justify-end">
          <div className="flex justify-between">
            <FormLabel>Payment provider</FormLabel>
            {/* // TODO: add link to payment provider configuration */}
            <SuperLink
              href={`/${workspaceSlug}/${projectSlug}/settings/payment`}
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

export function DescriptionFormField<TFieldValues extends FormValues>({
  form,
  isDisabled,
}: {
  form: UseFormReturn<TFieldValues>
  isDisabled?: boolean
}) {
  return (
    <FormField
      control={form.control}
      name={"description" as FieldPath<TFieldValues>}
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
