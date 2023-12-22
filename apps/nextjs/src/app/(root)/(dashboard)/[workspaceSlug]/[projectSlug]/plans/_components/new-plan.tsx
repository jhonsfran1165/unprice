"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { TRPCClientError } from "@trpc/client"

import type { CreatePlan } from "@builderai/db/schema/price"
import { createPlanSchema, currencyEnum } from "@builderai/db/schema/price"
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
import { Input } from "@builderai/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@builderai/ui/select"
import { useToast } from "@builderai/ui/use-toast"

import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"

export function NewPlanDialog() {
  const { toast } = useToast()
  const params = useParams()
  const router = useRouter()

  const projectSlug = params.projectSlug as string
  const [dialogOpen, setDialogOpen] = useState(false)

  const form = useZodForm({
    schema: createPlanSchema,
    defaultValues: {
      title: "",
      slug: "",
      projectSlug,
    },
  })

  const createPlan = api.plan.create.useMutation({
    onSettled: (data) => {
      router.refresh()
    },
    onError: (err) => {
      if (err instanceof TRPCClientError) {
        toast({
          title: err.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: "There was an error the plan. Please try again.",
          variant: "destructive",
        })
      }
    },
  })

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button className="button-primary">Create Plan</Button>
      </DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data: CreatePlan) => {
              createPlan.mutate(data)
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
                      {currencyEnum.enumValues.map((currency, index) => (
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
              </Button>
              <Button type="submit">Continue</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
