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
import { useParams, useSearchParams } from "next/navigation"
import { revalidateAppPath } from "~/actions/revalidate"
import { SubmitButton } from "~/components/submit-button"
import { toastAction } from "~/lib/toast"
import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"

export function StripePaymentConfigForm({
  provider,
  paymentProvider,
  setDialogOpen,
  onSuccess,
  skip,
}: {
  provider?: PaymentProviderConfig
  paymentProvider: PaymentProvider
  setDialogOpen?: (open: boolean) => void
  onSuccess?: (key: string) => void
  skip?: boolean
}) {
  const params = useParams()
  const searchParams = useSearchParams()

  const workspaceSlug = params.workspaceSlug as string
  let projectSlug = params.projectSlug as string

  if (!projectSlug) {
    projectSlug = searchParams.get("projectSlug") as string
  }

  const saveConfig = api.paymentProvider.saveConfig.useMutation({
    onSuccess: () => {
      toastAction("saved")
      setDialogOpen?.(false)
      onSuccess?.("")
      revalidateAppPath(`/${workspaceSlug}/${projectSlug}/settings/payment`, "page")
    },
  })

  const form = useZodForm({
    schema: insertPaymentProviderConfigSchema,
    defaultValues: provider ?? {
      paymentProvider: paymentProvider,
      key: "",
      keyIv: "",
      active: true,
      // from onboarding we can't infer the projectSlug, so we pass it as a search param
      ...(projectSlug ? { projectSlug } : {}),
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
        {/* <div className="flex flex-col items-end">
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
        </div> */}
        <FormField
          control={form.control}
          name="key"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stripe Secret Key</FormLabel>
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

        <div className="flex items-end justify-end gap-2 pt-4">
          {skip && (
            <Button
              variant="ghost"
              onClick={(e) => {
                e.preventDefault()
                setDialogOpen?.(false)
                onSuccess?.("")
              }}
            >
              Skip
            </Button>
          )}

          <SubmitButton
            type="submit"
            isSubmitting={form.formState.isSubmitting}
            isDisabled={form.formState.isSubmitting || !form.getValues("active")}
            label={"Save"}
          />
        </div>
      </form>
    </Form>
  )
}
