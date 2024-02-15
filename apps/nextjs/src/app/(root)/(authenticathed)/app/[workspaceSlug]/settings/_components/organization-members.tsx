"use client"

import { useRouter } from "next/navigation"
import { TRPCClientError } from "@trpc/client"
import { formatRelative } from "date-fns"

import { useAuth } from "@builderai/auth"
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
import { useToast } from "@builderai/ui/use-toast"

import { api } from "~/trpc/client"

function formatMemberRole(role: string) {
  for (const [key, value] of Object.entries(MEMBERSHIP)) {
    if (value === role) {
      return key
    }
  }
  return role
}

export function OrganizationMembers() {
  const [members] = api.workspaces.listMembers.useSuspenseQuery()
  const apiUtils = api.useUtils()
  const toaster = useToast()
  const router = useRouter()
  const { orgRole } = useAuth()

  const deleteMember = api.workspaces.deleteMember.useMutation({
    onSettled: async () => {
      await apiUtils.workspaces.listMembers.invalidate()
    },
    onSuccess: (data) => {
      toaster.toast({
        title: `Deleted ${data.memberName} from the workspace`,
      })
    },
    onError: (err) => {
      if (err instanceof TRPCClientError) {
        toaster.toast({
          title: err.message,
          variant: "destructive",
        })
      } else {
        toaster.toast({
          title: "Failed to delete member",
          variant: "destructive",
        })
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
            <TableRow key={member.id}>
              <TableCell className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage src={member.avatarUrl} alt={member.name} />
                  <AvatarFallback>{member.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span>{member.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {member.email}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {formatRelative(member.joinedAt, new Date())}
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
                      disabled={orgRole !== "admin"}
                      onClick={() => {
                        deleteMember.mutate({
                          userId: member.id,
                        })
                      }}
                      className="text-destructive"
                    >
                      Delete member
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
