"use client"

import { PAYMENT_PROVIDERS } from "@unprice/db/utils"
import type { PaymentProvider } from "@unprice/db/validators"
import { Card, CardContent, CardFooter } from "@unprice/ui/card"
import { Label } from "@unprice/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@unprice/ui/select"
import { useState } from "react"

import { Typography } from "@unprice/ui/typography"
import { UserPaymentMethod } from "~/components/forms/payment-method"
import { SubmitButton } from "~/components/submit-button"
import { api } from "~/trpc/client"

export function PaymentMethodForm({
  customerId,
  successUrl,
  cancelUrl,
  projectSlug,
  readonly = false,
  loading = false,
}: {
  customerId: string
  successUrl: string
  cancelUrl: string
  projectSlug?: string
  readonly?: boolean
  loading?: boolean
}) {
  // TODO: set with the default payment provider for the project
  const [provider, setProvider] = useState<PaymentProvider>("stripe")

  const { data, isLoading } = api.customers.listPaymentMethods.useQuery(
    {
      customerId,
      provider: provider,
      projectSlug,
    },
    {
      enabled: !loading,
    }
  )

  const createSession = api.customers.createPaymentMethod.useMutation({
    onSuccess: (data) => {
      if (data?.url) window.location.href = data?.url
    },
  })

  const defaultPaymentMethod = data?.paymentMethods.at(0)

  return (
    <Card variant="ghost" className="pb-4">
      <Typography variant="p" affects="removePaddingMargin">
        Default payment method. This payment method will be used for all future invoices.
      </Typography>
      <CardContent className="flex flex-col space-y-14 px-0 py-10">
        <UserPaymentMethod paymentMethod={defaultPaymentMethod} isLoading={isLoading} />
        {!readonly && (
          <div className="mx-auto flex w-1/2 flex-col gap-2">
            <Label htmlFor="provider">Payment Provider</Label>
            <Select
              value={provider}
              onValueChange={(e) => {
                setProvider(e as PaymentProvider)
              }}
            >
              <SelectTrigger id={"provider"}>
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_PROVIDERS.map((provider) => (
                  <SelectItem key={provider} value={provider}>
                    {provider}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col justify-center p-0">
        <SubmitButton
          className="w-56"
          onClick={() => {
            createSession.mutate({
              paymentProvider: provider,
              customerId,
              successUrl,
              cancelUrl,
            })
          }}
          isSubmitting={createSession.isPending}
          isDisabled={createSession.isPending || isLoading}
          isLoading={isLoading}
          label={!defaultPaymentMethod ? "Add Payment Method" : "Billing Portal"}
        />
      </CardFooter>
    </Card>
  )
}
