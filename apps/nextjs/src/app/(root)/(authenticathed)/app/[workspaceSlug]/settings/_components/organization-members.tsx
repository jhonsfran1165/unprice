"use client"

import { use } from "react"
import { TRPCClientError } from "@trpc/client"
import { formatRelative } from "date-fns"

import type { RouterOutputs } from "@builderai/api"
import { MEMBERSHIP } from "@builderai/config"
import { Avatar, AvatarFallback, AvatarImage } from "@builderai/ui/avatar"
import { Button } from "@builderai/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@builderai/ui/dropdown-menu"
import { Ellipsis } from "@builderai/ui/icons"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@builderai/ui/table"

import { useToastAction } from "~/lib/use-toast-action"
import { api } from "~/trpc/client"

function formatMemberRole(role: string) {
  for (const [key, value] of Object.entries(MEMBERSHIP)) {
    if (value === role) {
      return key
    }
  }
  return role
}

export function OrganizationMembers({
  listMembersPromise,
}: {
  listMembersPromise: Promise<RouterOutputs["workspaces"]["listMembers"]>
}) {
  const { members } = use(listMembersPromise)
  const apiUtils = api.useUtils()
  const { toast } = useToastAction()

  const deleteMember = api.workspaces.deleteMember.useMutation({
    onSettled: async () => {
      await apiUtils.workspaces.listMembers.invalidate()
    },
    onSuccess: () => {
      toast("deleted")
    },
    onError: (err) => {
      if (err instanceof TRPCClientError) {
        toast("error", err.message)
      } else {
        toast("error")
      }
    },
  })

  // TODO: DataTable with actions
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader className="bg-background">
          <TableRow className="pointer-events-none bg-muted">
            <TableHead>Name</TableHead>
            <TableHead>Joined at</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="w-16"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-background-base">
          {members.map((member) => (
            <TableRow key={member.userId}>
              <TableCell className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage
                    src={member.user.image ?? ""}
                    alt={member.user.name ?? ""}
                  />
                  <AvatarFallback>
                    {member.user.name?.substring(3)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span>{member.user.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {member.user.email}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {formatRelative(member.createdAt, new Date())}
              </TableCell>
              <TableCell>{formatMemberRole(member.role)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <Ellipsis className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      disabled={!["OWNER", "ADMIN"].includes(member.role)}
                      onClick={() => {
                        deleteMember.mutate({
                          userId: member.userId,
                          workspaceId: member.workspaceId,
                        })
                      }}
                      className="text-destructive"
                    >
                      Delete member from workspace
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
