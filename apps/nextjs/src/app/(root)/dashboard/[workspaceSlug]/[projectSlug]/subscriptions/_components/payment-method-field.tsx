"use client"

import type { UseFormReturn } from "react-hook-form"

import type { RouterOutputs } from "@unprice/api"
import { APP_DOMAIN } from "@unprice/config"
import type { InsertSubscription } from "@unprice/db/validators"
import { Button } from "@unprice/ui/button"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@unprice/ui/form"
import { RadioGroup, RadioGroupItem } from "@unprice/ui/radio-group"
import { Typography } from "@unprice/ui/typography"
import { cn } from "@unprice/ui/utils"
import { useParams } from "next/navigation"
import { EmptyPlaceholder } from "~/components/empty-placeholder"
import { PaymentMethodDialog } from "../../customers/_components/payment-method-dialog"

type PaymentMethodProviderData =
  RouterOutputs["customers"]["listPaymentMethods"]["paymentMethods"][number]

export default function PaymentMethodsFormField({
  form,
  paymentMethods,
  isDisabled,
  isLoading,
}: {
  form: UseFormReturn<InsertSubscription>
  paymentMethods: PaymentMethodProviderData[]
  isDisabled?: boolean
  isLoading?: boolean
}) {
  const workspaceSlug = useParams().workspaceSlug as string
  const projectSlug = useParams().projectSlug as string
  const customerId = form.getValues("customerId")
  const hasPaymentMethods = paymentMethods.length > 0
  const successUrl = `${APP_DOMAIN}/${workspaceSlug}/${projectSlug}/customers/${customerId}`
  const cancelUrl = `${APP_DOMAIN}/${workspaceSlug}/${projectSlug}/customers/${customerId}`

  const { errors } = form.formState

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-2">
        <FormLabel
          className={cn({
            "text-destructive": errors.defaultPaymentMethodId,
          })}
        >
          <Typography variant="h4" className="my-auto block">
            Payment method
          </Typography>
        </FormLabel>

        <div className="font-normal text-xs leading-snug">
          {"Select the payment method you want to use for this subscription."}
        </div>
        {errors.defaultPaymentMethodId && (
          <FormMessage>{errors.defaultPaymentMethodId.message}</FormMessage>
        )}
      </div>
      {hasPaymentMethods && (
        <FormField
          control={form.control}
          name="defaultPaymentMethodId"
          render={({ field }) => (
            <FormItem className="w-full space-y-1">
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value ?? ""}
                className="flex flex-col gap-4 pt-2"
                disabled={isDisabled}
              >
                {/* // TODO: add payment method link */}
                {paymentMethods.map((method) => (
                  <FormItem key={method.id}>
                    <FormLabel className="[&:has([data-state=checked])>div]:border-primary-border [&:has([data-state=checked])>div]:shadow-sm">
                      <FormControl>
                        <RadioGroupItem
                          value={method.id}
                          className="sr-only"
                          disabled={isDisabled}
                          checked={field.value === method.id}
                        />
                      </FormControl>
                      <div className="cursor-pointer items-center rounded-md border-2 border-muted p-6 hover:border-background-bgActive">
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
      )}
      {!hasPaymentMethods && (
        <EmptyPlaceholder isLoading={isLoading} className="min-h-[100px]">
          <EmptyPlaceholder.Description className="mt-0">
            No payment methods found.
          </EmptyPlaceholder.Description>
          <EmptyPlaceholder.Action>
            <PaymentMethodDialog
              customerId={customerId}
              successUrl={successUrl}
              cancelUrl={cancelUrl}
            >
              <Button variant="default" size="sm">
                Add payment method
              </Button>
            </PaymentMethodDialog>
          </EmptyPlaceholder.Action>
        </EmptyPlaceholder>
      )}
    </div>
  )
}
