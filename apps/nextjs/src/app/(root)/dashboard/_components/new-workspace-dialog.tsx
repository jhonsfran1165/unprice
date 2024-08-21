"use client"

import { useState } from "react"

import type { WorkspaceSignup } from "@unprice/db/validators"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@unprice/ui/dialog"
import NewWorkspaceForm from "./new-workspace-form"

export function NewWorkspaceDialog({
  defaultValues,
  children,
}: {
  defaultValues?: WorkspaceSignup
  children?: React.ReactNode
}) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Workspace Form</DialogTitle>
          <DialogDescription>Modify the workspace details below.</DialogDescription>
        </DialogHeader>

        <NewWorkspaceForm
          defaultValues={
            defaultValues ?? {
              name: "",
              planVersionId: "",
              config: [],
              defaultPaymentMethodId: "",
              customerId: "",
            }
          }
          setDialogOpen={setDialogOpen}
        />
      </DialogContent>
    </Dialog>
  )
}
