"use client"

import { useState } from "react"

import type { InsertPlan } from "@unprice/db/validators"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@unprice/ui/dialog"

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
      <DialogContent className="max-h-screen overflow-y-scroll">
        <DialogHeader>
          <DialogTitle>Plan Form</DialogTitle>

          <DialogDescription>Modify the plan details below.</DialogDescription>
        </DialogHeader>

        <PlanForm
          defaultValues={
            defaultValues ?? {
              slug: "",
              description: "",
              active: true,
              defaultPlan: false,
            }
          }
          setDialogOpen={setDialogOpen}
        />
      </DialogContent>
    </Dialog>
  )
}
