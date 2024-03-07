"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { CURRENCIES } from "@builderai/config"
import { slugify } from "@builderai/db/utils"
import type { CreatePlan } from "@builderai/db/validators"
import { createPlanSchema } from "@builderai/db/validators"
import { Button } from "@builderai/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@builderai/ui/dialog"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@builderai/ui/select"
import { Textarea } from "@builderai/ui/text-area"

import { SubmitButton } from "~/components/submit-button"
import { toastAction } from "~/lib/toast"
import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"

export function NewPlanDialog() {
  const router = useRouter()

  const [dialogOpen, setDialogOpen] = useState(false)

  const form = useZodForm({
    schema: createPlanSchema,
    defaultValues: {
      title: "",
      slug: "",
    },
  })

  const createPlan = api.plans.create.useMutation({
    onSuccess: (_data) => {
      form.reset()
      toastAction("saved")
      router.refresh()
    },
  })

  const onCreatePlan = async (values: CreatePlan) => {
    await createPlan.mutateAsync(values)
    setDialogOpen(false)
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button>Create Plan</Button>
      </DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onCreatePlan)}>
            <DialogHeader>
              <DialogTitle>Create Plan</DialogTitle>
              <DialogDescription>Add a new Plan</DialogDescription>
            </DialogHeader>

            <div className="my-4 space-y-4">
              <div className="flex w-full flex-row justify-between space-x-2">
                <div className="w-full">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan Title</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="FREE"
                            onChange={(e) => {
                              form.setValue("title", e.target.value)
                              const slug = slugify(e.target.value)
                              form.setValue("slug", slug)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="w-full">
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan Slug</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            readOnly
                            disabled
                            placeholder="free"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between">
                      <FormLabel>Currency of the plan</FormLabel>
                    </div>
                    <Select onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a plan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCIES.map((currency, index) => (
                          <SelectItem key={index} value={currency}>
                            {currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormDescription>
                      Enter a short description of the feature.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>{" "}
              <SubmitButton
                isSubmitting={form.formState.isSubmitting}
                isDisabled={form.formState.isSubmitting}
                label="Create Plan"
              />
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
