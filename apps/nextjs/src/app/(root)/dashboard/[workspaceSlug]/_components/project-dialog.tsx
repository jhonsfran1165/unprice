"use client"

import { useState } from "react"

import type { ProjectInsert } from "@unprice/db/validators"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@unprice/ui/dialog"

import { ProjectForm } from "./project-form"

export function ProjectDialog({
  defaultValues,
  children,
}: {
  label?: string
  defaultValues?: ProjectInsert
  children?: React.ReactNode
}) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-scroll">
        <DialogHeader>
          <DialogTitle>Project Form</DialogTitle>
          <DialogDescription>Modify the project details below.</DialogDescription>
        </DialogHeader>

        <ProjectForm
          defaultValues={
            defaultValues ?? {
              slug: "",
              name: "",
              url: "",
              defaultCurrency: "USD",
              timezone: "UTC",
              contactEmail: "",
            }
          }
          onSuccess={() => setDialogOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
