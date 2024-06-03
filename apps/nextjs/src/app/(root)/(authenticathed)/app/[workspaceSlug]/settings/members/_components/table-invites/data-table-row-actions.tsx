"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import type { Row } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { invitesSelectBase } from "@builderai/db/validators"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@builderai/ui/dropdown-menu"
import { LoadingAnimation } from "@builderai/ui/loading-animation"

import { toastAction } from "~/lib/toast"
import { api } from "~/trpc/client"

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

// TODO: improve this - use as reference the domain-dialog.tsx
export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const invite = invitesSelectBase.parse(row.original)
  const [alertOpen, setAlertOpen] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()

  const apiUtils = api.useUtils()
  const router = useRouter()

  const deleteInvite = api.workspaces.deleteInvite.useMutation({
    onSettled: async () => {
      setAlertOpen(false)
      await apiUtils.workspaces.listInvites.invalidate()
      router.refresh()
    },
    onSuccess: () => {
      toastAction("deleted")
    },
  })

  function onDelete() {
    startTransition(async () => {
      await deleteInvite.mutateAsync({
        email: invite.email,
        workspaceId: invite.workspaceId,
      })
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
            onClick={() => {
              setAlertOpen(false)
            }}
          >
            Change role
          </DropdownMenuItem>
          <AlertDialogTrigger
            asChild
            disabled={!["OWNER", "ADMIN"].includes(invite.role)}
          >
            <DropdownMenuItem className="text-destructive focus:bg-destructive focus:text-background">
              Delete invite from workspace
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>

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
