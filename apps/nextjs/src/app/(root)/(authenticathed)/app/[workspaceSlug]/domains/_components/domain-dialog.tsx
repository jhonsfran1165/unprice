"use client"

import { useState } from "react"

import { Button } from "@builderai/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@builderai/ui/dialog"

import { DomainForm } from "./domain-form"

export function DomainDialog({ label }: { label?: string }) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button>{label ?? "Create Domain"}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{label ?? "Create Domain"}</DialogTitle>
        </DialogHeader>

        <DomainForm
          onSubmit={() => {
            setDialogOpen(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
