"use client"

import { useState } from "react"
import { add, format } from "date-fns"

import type { CreateApiKey } from "@builderai/db/validators"
import { createApiKeySchema } from "@builderai/db/validators"
import { Button } from "@builderai/ui/button"
import { Calendar } from "@builderai/ui/calendar"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@builderai/ui/form"
import { Calendar as CalendarIcon } from "@builderai/ui/icons"
import { Input } from "@builderai/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@builderai/ui/popover"

import { toastAction } from "~/lib/toast"
import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"

export default function CreateApiKeyForm(props: {
  projectSlug: string
  onSuccess?: (key: string) => void
}) {
  const apiUtils = api.useUtils()
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  const form = useZodForm({
    schema: createApiKeySchema,
    defaultValues: { projectSlug: props.projectSlug },
  })

  const createApkiKey = api.apikeys.createApiKey.useMutation({
    onSettled: async () => {
      await apiUtils.apikeys.listApiKeys.invalidate({
        projectSlug: props.projectSlug,
      })
    },
    onSuccess: () => {
      toastAction("success")
      form.reset()
      props.onSuccess?.("")
    },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(
          async (data: CreateApiKey) => await createApkiKey.mutateAsync(data)
        )}
        className="space-y-4"
      >
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
                Enter a unique name for your token to differentiate it from
                other tokens.
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
                    <Button
                      variant={"outline"}
                      className="pl-3 text-left font-normal"
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span className="text-muted-foreground">
                          Pick a date
                        </span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(date) => {
                      field.onChange(date)
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
                We <b>strongly recommend</b> you setting an expiration date for
                your API key, but you can also leave it blank to create a
                permanent key.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && (
            <div className="mr-1" role="status">
              <div className="border-background h-3 w-3 animate-spin rounded-full border-2 border-r-transparent" />
            </div>
          )}
          Create Key
        </Button>
      </form>
    </Form>
  )
}
