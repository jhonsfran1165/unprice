"use client"

import { PAYMENT_PROVIDERS } from "@builderai/db/utils"
import type { Customer, PaymentProvider } from "@builderai/db/validators"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@builderai/ui/card"
import { Label } from "@builderai/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@builderai/ui/select"
import { useState } from "react"

import { SubmitButton } from "~/components/submit-button"
import { api } from "~/trpc/client"
import { UserPaymentMethod } from "./payment-method"

export function PaymentMethodForm({
  customer,
  successUrl,
  cancelUrl,
}: {
  customer: Customer
  successUrl: string
  cancelUrl: string
}) {
  // TODO: set with the default payment provider for the project
  const [provider, setProvider] = useState<PaymentProvider>("stripe")

  const { data } = api.customers.listPaymentMethods.useQuery({
    customerId: customer.id,
    provider: provider,
  })

  const createSession = api.customers.createPaymentMethod.useMutation({
    onSettled: (data) => {
      if (data?.url) window.location.href = data?.url
    },
  })

  const defaultPaymentMethod = data?.paymentMethods.at(0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Default Payment Method</CardTitle>
        <CardDescription>Default payment method for this customer</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <UserPaymentMethod paymentMethod={defaultPaymentMethod} />
        <div className="flex flex-col gap-2">
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
      </CardContent>
      <CardFooter className="flex flex-col justify-center">
        <SubmitButton
          variant="default"
          onClick={() => {
            createSession.mutate({
              paymentProvider: provider,
              customerId: customer.id,
              successUrl,
              cancelUrl,
            })
          }}
          isSubmitting={createSession.isPending}
          isDisabled={createSession.isPending}
          label={!defaultPaymentMethod ? "Add Payment Method" : "Billing Portal"}
        />
      </CardFooter>
    </Card>
  )
}
