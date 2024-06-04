"use client"

import { useState } from "react"

import type { InsertFeature } from "@builderai/db/validators"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@builderai/ui/dialog"

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
        </DialogHeader>

        <FeatureForm
          defaultValues={defaultValues ?? { title: "", slug: "", description: "" }}
          setDialogOpen={setDialogOpen}
        />
      </DialogContent>
    </Dialog>
  )
}
