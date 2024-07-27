"use client"

import type { Row } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"

import * as utils from "@unprice/db/utils"
import type { WorkspaceRole } from "@unprice/db/validators"
import { listMembersSchema } from "@unprice/db/validators"
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
} from "@unprice/ui/alert-dialog"
import { Button } from "@unprice/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@unprice/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@unprice/ui/dropdown-menu"
import { LoadingAnimation } from "@unprice/ui/loading-animation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@unprice/ui/select"

import { toastAction } from "~/lib/toast"
import { api } from "~/trpc/client"

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

export function DataTableRowActions<TData>({ row }: DataTableRowActionsProps<TData>) {
  const member = listMembersSchema.parse(row.original)
  const [open, setIsOpen] = React.useState(false)
  const [selectedRole, setSelectedRole] = React.useState<WorkspaceRole>(member.role)
  const [alertOpen, setAlertOpen] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()

  const apiUtils = api.useUtils()
  const router = useRouter()

  const deleteMember = api.workspaces.deleteMember.useMutation({
    onSettled: async () => {
      await apiUtils.workspaces.listMembers.invalidate()
      router.refresh()
    },
    onSuccess: () => {
      toastAction("deleted")
    },
  })

  const changeRoleMember = api.workspaces.changeRoleMember.useMutation({
    onSettled: async () => {
      await apiUtils.workspaces.listMembers.invalidate()
      router.refresh()
    },
    onSuccess: () => {
      toastAction("success")
    },
  })

  function onChangeRole() {
    startTransition(async () => {
      setIsOpen(false)

      await changeRoleMember.mutateAsync({
        userId: member.userId,
        workspaceId: member.workspaceId,
        role: selectedRole,
      })
    })
  }

  function onDelete() {
    startTransition(async () => {
      await deleteMember.mutateAsync({
        userId: member.userId,
        workspaceId: member.workspaceId,
      })
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
            onClick={() => {
              setIsOpen(true)
              setAlertOpen(false)
            }}
          >
            Change role
          </DropdownMenuItem>
          <AlertDialogTrigger asChild disabled={!["OWNER", "ADMIN"].includes(member.role)}>
            <DropdownMenuItem className="text-destructive focus:bg-destructive focus:text-background">
              Delete member from workspace
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={open} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change role</DialogTitle>
            <DialogDescription>
              The content filter flags text that may violate our content policy. It&apos;s powered
              by our moderation endpoint which is free to use to moderate your OpenAI API traffic.
              Learn more.
            </DialogDescription>
          </DialogHeader>
          <Select
            onValueChange={(data: WorkspaceRole) => {
              setSelectedRole(data)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a new role for this user" />
            </SelectTrigger>
            <SelectContent>
              {utils.ROLES_APP.map((role) => {
                return (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
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
                onChangeRole()
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
