"use client"

import { useState } from "react"

import type { CreateDomain } from "@builderai/db/validators"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@builderai/ui/dialog"

import { DomainForm } from "./domain-form"

export function DomainDialog({
  children,
  defaultValues,
}: {
  children: React.ReactNode
  defaultValues?: CreateDomain
}) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Domain for this workspace</DialogTitle>

          <DialogDescription>Modify the domain details below.</DialogDescription>
        </DialogHeader>

        <DomainForm
          defaultValues={defaultValues ?? { name: "" }}
          onSubmit={() => {
            setDialogOpen(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
