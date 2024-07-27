"use client"

import { useState } from "react"

import type { InsertFeature } from "@unprice/db/validators"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@unprice/ui/dialog"

import { FeatureForm } from "./feature-form"

export function FeatureDialog({
  defaultValues,
  children,
}: {
  label?: string
  defaultValues?: InsertFeature
  children?: React.ReactNode
}) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Feature Form</DialogTitle>

          <DialogDescription>Modify the feature details below.</DialogDescription>
        </DialogHeader>

        <FeatureForm
          defaultValues={defaultValues ?? { title: "", slug: "", description: "" }}
          setDialogOpen={setDialogOpen}
        />
      </DialogContent>
    </Dialog>
  )
}
