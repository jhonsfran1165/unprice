"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import { PAYMENT_PROVIDERS } from "@unprice/db/utils"
import type { PaymentProvider } from "@unprice/db/validators"
import { Card, CardContent, CardFooter } from "@unprice/ui/card"
import { Label } from "@unprice/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@unprice/ui/select"
import { useState } from "react"
import { UserPaymentMethod } from "~/components/forms/payment-method"
import { SubmitButton } from "~/components/submit-button"
import { useTRPC } from "~/trpc/client"

export function PaymentMethodForm({
  customerId,
  successUrl,
  cancelUrl,
  readonly = false,
  loading = false,
}: {
  customerId: string
  successUrl: string
  cancelUrl: string
  readonly?: boolean
  loading?: boolean
}) {
  // TODO: set with the default payment provider for the project
  const [provider, setProvider] = useState<PaymentProvider>("stripe")

  const trpc = useTRPC()
  const { data, isLoading, error } = useQuery(
    trpc.customers.listPaymentMethods.queryOptions(
      {
        customerId,
        provider: provider,
      },
      {
        enabled: !loading,
        retry: false,
      }
    )
  )

  const createSession = useMutation(
    trpc.customers.createPaymentMethod.mutationOptions({
      onSuccess: (data) => {
        if (data?.url) window.location.href = data?.url
      },
    })
  )

  const defaultPaymentMethod = data?.paymentMethods.at(0)

  return (
    <Card variant="ghost" className="pb-4">
      <CardContent className="flex flex-col space-y-14 px-0 py-10">
        <UserPaymentMethod paymentMethod={defaultPaymentMethod} isLoading={isLoading} />

        {!readonly && (
          <div className="mx-auto flex w-1/2 flex-col gap-2">
            <Label htmlFor="provider">Payment Provider</Label>
            {error && <div className="font-medium text-destructive text-sm">{error.message}</div>}
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
