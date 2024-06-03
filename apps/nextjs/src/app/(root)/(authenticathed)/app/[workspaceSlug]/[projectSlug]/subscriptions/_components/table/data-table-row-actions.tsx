"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import type { Row } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { subscriptionWithCustomerSchema } from "@builderai/db/validators"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@builderai/ui/alert-dialog"
import { Button } from "@builderai/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@builderai/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@builderai/ui/dropdown-menu"
import { LoadingAnimation } from "@builderai/ui/loading-animation"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@builderai/ui/select"

import { toastAction } from "~/lib/toast"
import { api } from "~/trpc/client"

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const subscription = subscriptionWithCustomerSchema.parse(row.original)
  const router = useRouter()
  const projectSlug = useParams().projectSlug as string

  const [open, setIsOpen] = React.useState(false)
  const [selectedPlan, setSelectedPlan] = React.useState<string | null>(null)
  const [alertOpen, setAlertOpen] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()

  const { data } = api.plans.listByActiveProject.useQuery({})
  const deleteUser = api.subscriptions.deleteCustomer.useMutation()
  const createPlanVersion = api.subscriptions.create.useMutation()

  function onDelete() {
    startTransition(async () => {
      try {
        if (!subscription.id) return
        await deleteUser.mutateAsync({ id: subscription.id })
        toastAction("deleted")
        router.refresh()
        setAlertOpen(false)
      } catch (error) {
        console.error(error)
        toastAction("error")
      }
    })
  }

  function onChangePlan() {
    startTransition(async () => {
      try {
        if (!selectedPlan) {
          toastAction("error")
          return
        }

        const [planId, planVersionId] = selectedPlan.split("*")

        await createPlanVersion.mutateAsync({
          planId: planId ?? "",
          customerId: subscription.id,
          planVersionId: planVersionId ?? "",
          projectSlug,
        })

        toastAction("success")
        router.refresh()
        setIsOpen(false)
      } catch (error) {
        console.error(error)
        toastAction("error")
      }
    })
  }

  return (
    <AlertDialog open={alertOpen} onOpenChange={(value) => setAlertOpen(value)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-accent h-8 w-8 p-0"
          >
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault()
              setIsOpen(true)
            }}
          >
            Add plan to the user
          </DropdownMenuItem>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem className="text-destructive focus:bg-destructive focus:text-background">
              Remove
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={open} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Content filter preferences</DialogTitle>
            <DialogDescription>
              The content filter flags text that may violate our content policy.
              It&apos;s powered by our moderation endpoint which is free to use
              to moderate your OpenAI API traffic. Learn more.
            </DialogDescription>
          </DialogHeader>
          <Select
            onValueChange={(data) => {
              setSelectedPlan(data)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a verified email to display" />
            </SelectTrigger>
            <SelectContent>
              {data?.plans?.length === 0 && (
                <SelectItem value="0" disabled>
                  No plans available
                </SelectItem>
              )}
              {data?.plans?.map((plan) => {
                return (
                  <SelectGroup key={plan.id}>
                    <SelectLabel>{plan.slug}</SelectLabel>
                    {plan.versions
                      .filter((version) => version.status === "published")
                      .map((version) => {
                        const planAndVersionValue = `${plan.id}*${version.id}`
                        return (
                          <SelectItem
                            key={version.id}
                            value={planAndVersionValue}
                          >
                            {plan.slug} - v{version.version}
                          </SelectItem>
                        )
                      })}
                  </SelectGroup>
                )
              })}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setIsOpen(false)
              }}
            >
              Close
            </Button>
            <Button
              onClick={(e) => {
                e.preventDefault()
                onChangePlan()
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will remove the user from your
            team.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onDelete()
            }}
            disabled={isPending}
            className="hover:bg-destructive/90 bg-destructive text-destructive-foreground"
          >
            {!isPending ? "Remove" : <LoadingAnimation />}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
