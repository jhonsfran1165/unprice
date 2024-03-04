"use client"

import { useState } from "react"

import type { CreateDomain } from "@builderai/db/validators"
import { Button } from "@builderai/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@builderai/ui/dialog"

import { DomainForm } from "./domain-form"

export function DomainDialog({
  label,
  defaultValues,
}: {
  label?: string
  defaultValues?: CreateDomain
}) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button>{label ?? "Create Domain"}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{"Domain for this workspace"}</DialogTitle>
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
