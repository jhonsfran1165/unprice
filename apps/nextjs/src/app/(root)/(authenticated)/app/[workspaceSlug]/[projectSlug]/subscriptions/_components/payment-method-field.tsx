"use client"

import type { UseFormReturn } from "react-hook-form"

import type { RouterOutputs } from "@unprice/api"
import type { InsertSubscription } from "@unprice/db/validators"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@unprice/ui/form"
import { RadioGroup, RadioGroupItem } from "@unprice/ui/radio-group"

type PaymentMethodProviderData =
  RouterOutputs["customers"]["listPaymentMethods"]["paymentMethods"][number]

export default function PaymentMethodsFormField({
  form,
  paymentMethods,
}: {
  form: UseFormReturn<InsertSubscription>
  paymentMethods: PaymentMethodProviderData[]
}) {
  return (
    <div className="flex w-full flex-row gap-4">
      <FormField
        control={form.control}
        name="defaultPaymentMethodId"
        render={({ field }) => (
          <FormItem className="w-full space-y-1">
            <FormLabel>Payment information</FormLabel>
            <FormDescription>
              Select the payment method you want to use for this subscription.
            </FormDescription>
            <FormMessage />
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value ?? ""}
              className="flex flex-col gap-4 pt-2"
            >
              {/* // TODO: add payment method link */}
              {paymentMethods.map((method) => (
                <FormItem key={method.id}>
                  <FormLabel className="[&:has([data-state=checked])>div]:border-background-borderHover">
                    <FormControl>
                      <RadioGroupItem value={method.id} className="sr-only" />
                    </FormControl>
                    <div className="cursor-pointer items-center rounded-md border-2 border-muted p-6 hover:border-accent">
                      <div className="flex flex-row items-center justify-between">
                        <div className="inline-flex gap-2">
                          <span>{method?.brand}</span>
                          <span>**** **** **** {method?.last4}</span>
                        </div>
                        <div className="inline-flex gap-2">
                          <span>Expires</span>
                          <span>
                            {method?.expMonth?.toLocaleString("en-US", {
                              minimumIntegerDigits: 2,
                            })}
                            /{method?.expYear}
                          </span>
                        </div>
                      </div>
                    </div>
                  </FormLabel>
                </FormItem>
              ))}
            </RadioGroup>
          </FormItem>
        )}
      />
    </div>
  )
}
