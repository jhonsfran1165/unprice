"use client"

import React from "react"

import type { PlanList } from "@builderai/db/schema/price"
import type { UserSubscription } from "@builderai/db/schema/subscription"
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
import { useToast } from "@builderai/ui/use-toast"

export function UserActions({
  projectSlug,
  user,
  plans,
}: {
  projectSlug: string
  user: UserSubscription
  plans: PlanList[]
}) {
  const toaster = useToast()
  const [open, setIsOpen] = React.useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)

  console.log(plans)

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
            onClick={async () => {
              setIsOpen(true)
            }}
          >
            Add plan to the user
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={async () => {
              console.log("edit")
              setShowDeleteDialog(true)
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
            onValueChange={() => {
              console.log("changed")
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
                        return (
                          <SelectItem key={version.id} value={version.id}>
                            v{version.version} - {plan.slug}
                          </SelectItem>
                        )
                      })}
                  </SelectGroup>
                )
              })}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Close
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

                toaster.toast({
                  description: "This user has been deleted.",
                })
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
