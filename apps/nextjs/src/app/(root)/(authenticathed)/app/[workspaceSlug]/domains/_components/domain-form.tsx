"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import type { CreateDomain, Domain } from "@builderai/db/validators"
import { domainAddSchema } from "@builderai/db/validators"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@builderai/ui/form"

import { SubmitButton } from "~/components/submit-button"
import { InputWithAddons } from "~/components/test"
import { toastAction } from "~/lib/toast"
import { useDebounce } from "~/lib/use-debounce"
import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"

export function DomainForm({
  onSubmit,
}: {
  onSubmit?: (data: Domain) => void
}) {
  const router = useRouter()

  const form = useZodForm({
    schema: domainAddSchema,
    defaultValues: {
      name: "",
    },
  })

  const debouncedDomain = useDebounce(form.getValues("name"), 500)
  const { data } = api.domains.exists.useQuery(
    {
      domain: debouncedDomain,
    },
    {
      enabled: !!debouncedDomain,
    }
  )

  useEffect(() => {
    if (data?.exist) {
      form.setError("name", {
        type: "custom",
        message: "Domain already exists",
      })
    } else {
      form.clearErrors("name")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data)])

  const createPlan = api.domains.create.useMutation({
    onSuccess: ({ domain }) => {
      form.reset()
      toastAction("saved")
      router.refresh()
      onSubmit?.(domain)
    },
  })

  const onCreateDomain = async (values: CreateDomain) => {
    await createPlan.mutateAsync(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onCreateDomain)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Domain</FormLabel>
              <FormControl>
                <InputWithAddons
                  {...field}
                  placeholder="status.builderai.com"
                  leading="https://"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <SubmitButton
            isSubmitting={form.formState.isSubmitting}
            isDisabled={form.formState.isSubmitting}
            label="Create Domain"
          />
        </div>
      </form>
    </Form>
  )
}
