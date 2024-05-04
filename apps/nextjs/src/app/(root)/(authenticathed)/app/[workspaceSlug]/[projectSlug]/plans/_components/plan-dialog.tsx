"use client"

import { useState } from "react"

import type { InsertPlan } from "@builderai/db/validators"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@builderai/ui/dialog"

import { PlanForm } from "./plan-form"

export function PlanDialog({
  defaultValues,
  children,
}: {
  label?: string
  defaultValues?: InsertPlan
  children?: React.ReactNode
}) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{"Plan Form"}</DialogTitle>
        </DialogHeader>

        <PlanForm
          defaultValues={
            defaultValues ?? {
              slug: "",
              description: "",
              active: true,
            }
          }
          setDialogOpen={setDialogOpen}
        />
      </DialogContent>
    </Dialog>
  )
}
