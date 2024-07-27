"use client"

import { Button } from "@unprice/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@unprice/ui/dialog"

import { InviteMemberForm } from "./invite-member-form"

export const InviteMemberDialog = ({
  workspaceSlug,
}: {
  workspaceSlug: string
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Invite member</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite to workspace</DialogTitle>
          <DialogDescription>Invite a member to this workspace</DialogDescription>
        </DialogHeader>
        <InviteMemberForm workspaceSlug={workspaceSlug} />
      </DialogContent>
    </Dialog>
  )
}
