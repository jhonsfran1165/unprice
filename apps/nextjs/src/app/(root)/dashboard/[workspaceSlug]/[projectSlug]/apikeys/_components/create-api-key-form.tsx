"use client"

import { add, endOfDay, format } from "date-fns"
import { useState } from "react"

import type { CreateApiKey } from "@unprice/db/validators"
import { createApiKeySchema } from "@unprice/db/validators"
import { Button } from "@unprice/ui/button"
import { Calendar } from "@unprice/ui/calendar"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@unprice/ui/form"
import { Calendar as CalendarIcon } from "@unprice/ui/icons"
import { Input } from "@unprice/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@unprice/ui/popover"

import { useParams } from "next/navigation"
import { revalidateAppPath } from "~/actions/revalidate"
import { SubmitButton } from "~/components/submit-button"
import { toastAction } from "~/lib/toast"
import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"

export default function CreateApiKeyForm(props: {
  setDialogOpen?: (open: boolean) => void
  onSuccess?: (key: string) => void
  defaultValues?: CreateApiKey
}) {
  const params = useParams()
  const workspaceSlug = params.workspaceSlug as string
  const projectSlug = params.projectSlug as string
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  const form = useZodForm({
    schema: createApiKeySchema,
    defaultValues: props.defaultValues,
  })

  const create = api.apikeys.create.useMutation({
    onSuccess: () => {
      toastAction("success")
      form.reset()
      props.setDialogOpen?.(false)
      props.onSuccess?.("")
      revalidateAppPath(`/${workspaceSlug}/${projectSlug}/apikeys`, "page")
    },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (data: CreateApiKey) => await create.mutateAsync(data))}
        className="space-y-6"
      >
        <div className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="api-key-prod" />
                </FormControl>
                <FormDescription>
                  Enter a unique name for your token to differentiate it from other tokens.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expiresAt"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Exiration date</FormLabel>
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant={"outline"} className="pl-3 text-left font-normal">
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span className="text-muted-foreground">Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => {
                        if (!date) {
                          field.onChange(undefined)
                          setDatePickerOpen(false)
                          return
                        }
                        const midnight = endOfDay(date)
                        field.onChange(midnight.getTime())
                        setDatePickerOpen(false)
                      }}
                      disabled={(date) =>
                        // future dates up to 1 year only
                        date < new Date() || date > add(new Date(), { years: 1 })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  We <b>strongly recommend</b> you setting an expiration date for your API key, but
                  you can also leave it blank to create a permanent key.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <SubmitButton
            type="submit"
            isSubmitting={form.formState.isSubmitting}
            isDisabled={form.formState.isSubmitting}
            label={"Create"}
          />
        </div>
      </form>
    </Form>
  )
}
