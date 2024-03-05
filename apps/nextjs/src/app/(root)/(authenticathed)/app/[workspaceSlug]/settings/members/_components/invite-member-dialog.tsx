"use client"

import { Button } from "@builderai/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@builderai/ui/dialog"

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
          <DialogTitle>{"Invite to workspace"}</DialogTitle>
        </DialogHeader>
        <InviteMemberForm workspaceSlug={workspaceSlug} />
      </DialogContent>
    </Dialog>
  )
}
