"use client"

import { useRouter } from "next/navigation"
import { startTransition } from "react"

import type { InsertPage } from "@builderai/db/validators"
import { pageInsertBaseSchema } from "@builderai/db/validators"
import { Button } from "@builderai/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@builderai/ui/form"
import { Input } from "@builderai/ui/input"

import { ConfirmAction } from "~/components/confirm-action"
import { InputWithAddons } from "~/components/input-addons"
import { SubmitButton } from "~/components/submit-button"
import { PAGES_BASE_DOMAIN } from "~/constants"
import { toastAction } from "~/lib/toast"
import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"

export function PageForm({
  setDialogOpen,
  defaultValues,
}: {
  setDialogOpen?: (open: boolean) => void
  defaultValues: InsertPage
}) {
  const router = useRouter()
  const editMode = !!defaultValues.id

  const form = useZodForm({
    schema: pageInsertBaseSchema,
    defaultValues: defaultValues,
    reValidateMode: "onSubmit",
  })

  const createPage = api.pages.create.useMutation({
    onSuccess: ({ page }) => {
      form.reset(page)
      toastAction("saved")
      setDialogOpen?.(false)
      router.refresh()
    },
  })

  const updatePage = api.pages.update.useMutation({
    onSuccess: ({ page }) => {
      form.reset(page)
      toastAction("updated")
      setDialogOpen?.(false)

      // Only needed when the form is inside a uncontrolled dialog - normally updates
      // FIXME: hack to close the dialog when the form is inside a uncontrolled dialog
      if (!setDialogOpen) {
        const escKeyEvent = new KeyboardEvent("keydown", {
          key: "Escape",
        })
        document.dispatchEvent(escKeyEvent)
      }

      router.refresh()
    },
  })

  const deletePage = api.pages.remove.useMutation({
    onSuccess: () => {
      toastAction("deleted")

      setDialogOpen?.(false)
      // Only needed when the form is inside a uncontrolled dialog - normally updates
      // FIXME: hack to close the dialog when the form is inside a uncontrolled dialog
      if (!setDialogOpen) {
        const escKeyEvent = new KeyboardEvent("keydown", {
          key: "Escape",
        })
        document.dispatchEvent(escKeyEvent)
      }

      form.reset()
      router.refresh()
    },
  })

  const onSubmitForm = async (data: InsertPage) => {
    if (!defaultValues.id) {
      await createPage.mutateAsync(data)
    }

    if (defaultValues.id && defaultValues.projectId) {
      await updatePage.mutateAsync({
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

      void deletePage.mutateAsync({ id: defaultValues.id })
    })
  }

  return (
    <Form {...form}>
      <form className="space-y-6">
        <div className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Page name</FormLabel>
                <FormDescription>
                  Name this page so you can easily identify it later.
                </FormDescription>
                <FormControl>
                  <Input {...field} placeholder="production price page" disabled={editMode} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="subdomain"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Page subdomain</FormLabel>
                <FormDescription>
                  You can easily host this page on a subdomain of your choice.
                </FormDescription>
                <FormControl>
                  <InputWithAddons
                    {...field}
                    leading={"https://"}
                    trailing={PAGES_BASE_DOMAIN}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="customDomain"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Page custom domain</FormLabel>
                <FormDescription>
                  You can bring your own domain to host this page. You have to include the protocol.
                  e.g (https://example.com)
                </FormDescription>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="free"
                    disabled={editMode}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          {editMode && (
            <ConfirmAction
              confirmAction={() => {
                setDialogOpen?.(false)
                onDelete()
              }}
            >
              <Button variant={"link"} disabled={deletePage.isPending}>
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
