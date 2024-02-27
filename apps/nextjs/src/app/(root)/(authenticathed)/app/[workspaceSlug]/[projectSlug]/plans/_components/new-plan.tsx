"use client"

import { startTransition, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { TRPCClientError } from "@trpc/client"

import { CURRENCIES } from "@builderai/config"
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@builderai/ui/form"
import { Add } from "@builderai/ui/icons"
import { Input } from "@builderai/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@builderai/ui/select"
import type { CreatePlan } from "@builderai/validators/price"
import { createPlanSchema } from "@builderai/validators/price"

import { useToastAction } from "~/lib/use-toast-action"
import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"

export function NewPlanDialog() {
  const { toast } = useToastAction()
  const params = useParams()
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
      toast("saved")
      router.refresh()
    },
    onError: (err) => {
      if (err instanceof TRPCClientError) {
        toast("error", err.message)
      } else {
        toast("error")
      }
    },
  })

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button className="h-8 w-8" size={"icon"}>
          <Add className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data: CreatePlan) => {
              startTransition(() => {
                setDialogOpen(false)
                void createPlan.mutateAsync(data)
              })
            })}
            className="space-y-4"
          >
            <DialogHeader>
              <DialogTitle>Create Plan</DialogTitle>
              <DialogDescription>Add a new Plan</DialogDescription>
            </DialogHeader>

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan Slug</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Acme Inc." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Acme Inc." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between">
                    <FormLabel>Subscription plan *</FormLabel>
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

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>{" "}
              <Button type="submit">Create plan</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
