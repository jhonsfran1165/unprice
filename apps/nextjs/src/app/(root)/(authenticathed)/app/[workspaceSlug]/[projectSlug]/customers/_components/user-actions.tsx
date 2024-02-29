"use client"

import React from "react"
import { useRouter } from "next/navigation"

import type { Customer, PlanList } from "@builderai/db/validators"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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
import { Ellipsis } from "@builderai/ui/icons"
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

export function UserActions({
  projectSlug,
  customer,
  plans,
}: {
  projectSlug: string
  customer: Customer
  plans: PlanList[]
}) {
  const router = useRouter()
  const [open, setIsOpen] = React.useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const [selectedPlan, setSelectedPlan] = React.useState<string | null>(null)

  const createPlanVersion = api.subscriptions.create.useMutation({
    onSettled: () => {
      router.refresh()
    },
    onSuccess: () => {
      toastAction("success")
    },
  })

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <Ellipsis className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="right">
          <DropdownMenuItem
            onClick={() => {
              setIsOpen(true)
            }}
          >
            Add plan to the user
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              console.log("Edit user")
            }}
            className="text-destructive"
          >
            Delete user
          </DropdownMenuItem>
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
              {plans.map((plan) => {
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
              onClick={async () => {
                if (!selectedPlan) {
                  toastAction("error", "Please select a plan")
                  return
                }

                const [planId, planVersionId] = selectedPlan.split("*")

                await createPlanVersion.mutateAsync({
                  planId: planId ?? "",
                  customerId: customer.id,
                  planVersionId: planVersionId ?? "",
                  projectSlug,
                })

                setIsOpen(false)
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This preset will no longer be
              accessible by you or others you&apos;ve shared it with.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => {
                setShowDeleteDialog(false)
                toastAction("deleted")
              }}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
