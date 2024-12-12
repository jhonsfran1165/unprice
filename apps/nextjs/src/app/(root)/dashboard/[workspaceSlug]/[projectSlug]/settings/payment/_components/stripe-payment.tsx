"use client"
import type {
  InsertPaymentProviderConfig,
  PaymentProvider,
  PaymentProviderConfig,
} from "@unprice/db/validators"
import { insertPaymentProviderConfigSchema } from "@unprice/db/validators"
import { Button } from "@unprice/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@unprice/ui/form"
import { Input } from "@unprice/ui/input"
import { LoadingAnimation } from "@unprice/ui/loading-animation"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@unprice/ui/card"
import { Switch } from "@unprice/ui/switch"
import { toastAction } from "~/lib/toast"
import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"

export function StripePayment({
  provider,
  paymentProvider,
}: { provider?: PaymentProviderConfig; paymentProvider: PaymentProvider }) {
  const saveConfig = api.paymentProvider.saveConfig.useMutation({
    onSuccess: () => {
      toastAction("saved")
    },
  })

  const form = useZodForm({
    schema: insertPaymentProviderConfigSchema,
    defaultValues: provider ?? {
      paymentProvider: paymentProvider,
      key: "",
      keyIv: "",
      active: false,
    },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (data: InsertPaymentProviderConfig) => {
          await saveConfig.mutateAsync(data)
        })}
        className="space-y-2"
      >
        <Card>
          <CardHeader>
            <div className="flex flex-row items-center justify-between">
              <div className="flex flex-col space-y-1.5">
                <CardTitle>Stripe configuration</CardTitle>
                <CardDescription>
                  Configure the API key for connection to your stripe account
                </CardDescription>
              </div>
              <div className="flex flex-col items-end">
                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <FormField
              control={form.control}
              name="key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Api Key</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="stripe api key"
                      type="password"
                      disabled={!form.getValues("active")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={!form.getValues("active") || saveConfig.isPending}>
              Save
              {form.formState.isSubmitting && <LoadingAnimation className="ml-2" />}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}
