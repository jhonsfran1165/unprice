"use client"

import { use } from "react"
import Link from "next/link"
import { toDecimal } from "dinero.js"

import type { PurchaseOrg } from "@builderai/db/schema"
import { purchaseWorkspaceSchema } from "@builderai/db/schema"
import { Button } from "@builderai/ui/button"
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

import { currencySymbol } from "~/lib/currency"
import { useZodForm } from "~/lib/zod-form"
import { api } from "~/trpc/client"

export default function NewOrganizationDialog(props: {
  closeDialog: () => void
}) {
  const plans = use(api.stripe.plans.query())

  const form = useZodForm({ schema: purchaseWorkspaceSchema })

  const toaster = useToast()

  async function handleCreateOrg(data: PurchaseOrg) {
    const response = await api.stripe.purchaseOrg
      .mutate(data)
      .catch(() => ({ success: false as const }))

    if (response.success) window.location.href = response.url
    else
      toaster.toast({
        title: "Error",
        description:
          "There was an error setting up your organization. Please try again.",
        variant: "destructive",
      })
  }

  return (
    <DialogContent>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleCreateOrg)}
          className="space-y-4"
        >
          <DialogHeader>
            <DialogTitle>Create organization</DialogTitle>
            <DialogDescription>
              Add a new organization to manage products and customers.
            </DialogDescription>
          </DialogHeader>

          <FormField
            control={form.control}
            name="orgName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization name *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Acme Inc." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="planId"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between">
                  <FormLabel>Subscription plan *</FormLabel>
                  <Link
                    href="/pricing"
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    What&apos;s included in each plan?
                  </Link>
                </div>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.priceId} value={plan.priceId}>
                        <span className="font-medium">{plan.name}</span> -{" "}
                        <span className="text-muted-foreground">
                          {toDecimal(
                            plan.price,
                            ({ value, currency }) =>
                              `${currencySymbol(currency.code)}${value}`
                          )}{" "}
                          per month
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => props.closeDialog()}>
              Cancel
            </Button>
            <Button type="submit">Continue</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  )
}
