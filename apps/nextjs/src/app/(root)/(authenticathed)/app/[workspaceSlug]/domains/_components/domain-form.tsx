"use client"

import { useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"

import type { CreateDomain, Domain } from "@builderai/db/validators"
import { domainCreateBaseSchema } from "@builderai/db/validators"
import { Button } from "@builderai/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@builderai/ui/form"

import { ConfirmAction } from "~/components/confirm-action"
import { SubmitButton } from "~/components/submit-button"
import { InputWithAddons } from "~/components/test"
import { toastAction } from "~/lib/toast"
import { useDebounce } from "~/lib/use-debounce"
import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"

export function DomainForm({
  onSubmit,
  defaultValues,
}: {
  onSubmit?: (data?: Domain) => void
  defaultValues: CreateDomain
}) {
  const router = useRouter()

  const form = useZodForm({
    schema: domainCreateBaseSchema,
    mode: "onChange",
    defaultValues: defaultValues,
  })

  const [_isPending, startTransition] = useTransition()

  const editMode = !!defaultValues.id
  const watchDomain = form.watch("name")
  const debouncedDomain = useDebounce(watchDomain, 1000)
  const domainExist = api.domains.exists.useMutation()

  // TODO: compare with the validation on feature-form.tsx
  useEffect(() => {
    if (debouncedDomain) {
      void domainExist
        .mutateAsync({
          domain: debouncedDomain,
        })
        .then((res) => {
          if (res.exist) {
            if (form.getValues("name") === defaultValues.name) {
              return
            }

            form.setError("name", {
              type: "custom",
              message: "Domain already exists",
            })
          } else {
            const error = form.formState.errors.name

            if (error?.type === "custom") {
              form.clearErrors("name")
            }
          }
        })
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedDomain])

  const createDomain = api.domains.create.useMutation({
    onSuccess: ({ domain }) => {
      form.reset(defaultValues)
      toastAction("saved")
      router.refresh()
      onSubmit?.(domain)
    },
  })

  const updateDomain = api.domains.update.useMutation({
    onSuccess: ({ domain }) => {
      form.reset()
      toastAction("updated")
      router.refresh()
      onSubmit?.(domain)
    },
  })

  const deleteDomain = api.domains.remove.useMutation()

  function onDelete() {
    startTransition(async () => {
      if (!defaultValues.id) return
      await deleteDomain.mutateAsync({ id: defaultValues.id })
      form.reset()
      toastAction("deleted")
      router.refresh()
    })
  }

  const onSubmitForm = async (values: CreateDomain) => {
    if (!defaultValues.id) {
      await createDomain.mutateAsync(values)
    }

    if (defaultValues.id) {
      await updateDomain.mutateAsync({ ...values, id: defaultValues.id })
    }
  }

  const submitDisabled =
    form.formState.isSubmitting ||
    domainExist.isPending ||
    !form.formState.isValid

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitForm)}>
        <div className="space-y-4">
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
        </div>

        <div className="mt-8 flex justify-end space-x-2">
          {editMode && (
            <ConfirmAction
              confirmAction={() => {
                onSubmit?.() // close the dialog
                onDelete()
              }}
            >
              <Button variant={"destructive"}>Delete</Button>
            </ConfirmAction>
          )}
          <SubmitButton
            isSubmitting={form.formState.isSubmitting}
            isDisabled={submitDisabled}
            label={editMode ? "Update" : "Create"}
          />
        </div>
      </form>
    </Form>
  )
}
