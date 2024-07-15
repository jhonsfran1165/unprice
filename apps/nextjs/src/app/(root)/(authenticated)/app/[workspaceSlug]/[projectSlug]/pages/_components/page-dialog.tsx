"use client"

import { useState } from "react"

import type { InsertPage } from "@builderai/db/validators"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@builderai/ui/dialog"

import { PageForm } from "./page-form"

export function PageDialog({
  defaultValues,
  children,
}: {
  label?: string
  defaultValues?: InsertPage
  children?: React.ReactNode
}) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-screen overflow-y-scroll">
        <DialogHeader>
          <DialogTitle>Plan Form</DialogTitle>

          <DialogDescription>Modify the plan details below.</DialogDescription>
        </DialogHeader>

        <PageForm
          defaultValues={
            defaultValues ?? {
              name: "",
              subdomain: "",
              customDomain: "",
              projectId: "",
            }
          }
          setDialogOpen={setDialogOpen}
        />
      </DialogContent>
    </Dialog>
  )
}
