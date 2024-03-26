"use client"

import { startTransition } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"

import type { InsertCustomer } from "@builderai/db/validators"
import { customerInsertSchema } from "@builderai/db/validators"
import { Button } from "@builderai/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@builderai/ui/form"
import { Input } from "@builderai/ui/input"
import { Separator } from "@builderai/ui/separator"

import { ConfirmAction } from "~/components/confirm-action"
import { SubmitButton } from "~/components/submit-button"
import { toastAction } from "~/lib/toast"
import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"

export function UserForm({
  setDialogOpen,
  defaultValues,
}: {
  setDialogOpen?: (open: boolean) => void
  defaultValues: InsertCustomer
}) {
  const router = useRouter()
  const editMode = defaultValues.id ? true : false
  // TODO: change this
  const customerExist = api.plans.exist.useMutation()

  // async validation only when creating a new plan
  const formSchema = editMode
    ? customerInsertSchema
    : customerInsertSchema.extend({
        email: z
          .string()
          .min(3)
          .refine(async (slug) => {
            const { exist } = await customerExist.mutateAsync({
              slug: slug,
            })

            return !exist
          }, "Email already exists."),
      })

  const form = useZodForm({
    schema: formSchema,
    defaultValues: defaultValues,
  })

  const createCustomer = api.subscriptions.createCustomer.useMutation({
    onSuccess: ({ customer }) => {
      form.reset(customer)
      toastAction("saved")
      setDialogOpen?.(false)
      router.refresh()
    },
  })

  // TODO: add update customer
  const updateCustomer = api.subscriptions.createCustomer.useMutation({
    onSuccess: ({ customer }) => {
      form.reset(customer)
      toastAction("updated")
      setDialogOpen?.(false)
      router.refresh()
    },
  })

  const deleteCustomer = api.subscriptions.deleteCustomer.useMutation({
    onSuccess: () => {
      toastAction("deleted")
      form.reset()
      router.refresh()
    },
  })

  const onSubmitForm = async (data: InsertCustomer) => {
    if (!defaultValues.id) {
      await createCustomer.mutateAsync(data)
    }

    if (defaultValues.id && defaultValues.projectId) {
      await updateCustomer.mutateAsync({
        ...data,
        id: defaultValues.id,
      })
    }
  }

  function onDelete() {
    startTransition(() => {
      if (!defaultValues.id) {
        toastAction("error", "no data defined")
        return
      }

      void deleteCustomer.mutateAsync({
        id: defaultValues.id,
      })
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-6">
        <div className="flex justify-between gap-2">
          <div className="flex-1">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex-1">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>email</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        <div className="mt-8 flex justify-end space-x-2">
          {editMode && (
            <ConfirmAction
              confirmAction={() => {
                setDialogOpen?.(false)
                onDelete()
              }}
            >
              <Button
                variant={"destructive"}
                disabled={deleteCustomer.isPending}
              >
                Delete
              </Button>
            </ConfirmAction>
          )}
          <SubmitButton
            onClick={() => form.handleSubmit(onSubmitForm)()}
            isSubmitting={form.formState.isSubmitting}
            isDisabled={form.formState.isSubmitting}
            label={editMode ? "Update" : "Create"}
          />
        </div>
      </form>
    </Form>
  )
}
