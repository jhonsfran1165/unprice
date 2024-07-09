"use client"

import type { Row } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"

import { customerSelectSchema } from "@builderai/db/validators"
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

export function DataTableRowActions<TData>({ row }: DataTableRowActionsProps<TData>) {
  const customer = customerSelectSchema.parse(row.original)
  const router = useRouter()

  const [open, setIsOpen] = React.useState(false)
  const [alertOpen, setAlertOpen] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()

  const { data, isLoading } = api.plans.listByActiveProject.useQuery({})

  const removeCustomer = api.customers.remove.useMutation({
    onSuccess: () => {
      toastAction("deleted")
      setAlertOpen(false)
      router.refresh()
    },
  })

  function onDelete() {
    startTransition(() => {
      void removeCustomer.mutateAsync({ id: customer.id })
    })
  }

  return (
    <AlertDialog open={alertOpen} onOpenChange={(value) => setAlertOpen(value)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 data-[state=open]:bg-accent">
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
              The content filter flags text that may violate our content policy. It&apos;s powered
              by our moderation endpoint which is free to use to moderate your OpenAI API traffic.
              Learn more.
            </DialogDescription>
          </DialogHeader>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select a verified email to display" />
            </SelectTrigger>
            <SelectContent>
              {data?.plans?.length === 0 ||
                (isLoading && (
                  <SelectItem value="0" disabled>
                    No plans available
                  </SelectItem>
                ))}
              {data?.plans?.map((plan) => {
                if (plan.versions.length === 0) {
                  return null
                }

                return (
                  <SelectGroup key={plan.id}>
                    <SelectLabel>{plan.slug}</SelectLabel>
                    {plan.versions.map((version) => {
                      return (
                        <SelectItem key={version.id} value={version.id}>
                          {`${version.title} - ${version.currency} - ${version.version}`}
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
            This action cannot be undone. This will remove the user from your team.
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
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {!isPending ? "Remove" : <LoadingAnimation />}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
