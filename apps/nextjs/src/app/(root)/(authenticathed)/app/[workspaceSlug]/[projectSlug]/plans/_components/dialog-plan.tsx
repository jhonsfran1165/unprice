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
          <DialogTitle>{"Feature Data"}</DialogTitle>
        </DialogHeader>

        <PlanForm
          defaultValues={
            defaultValues ?? {
              title: "",
              slug: "",
              description: "",
              type: "recurring",
              billingPeriod: "monthly",
              startCycle: 1,
              currency: "USD",
              gracePeriod: 0,
              active: true,
            }
          }
          setDialogOpen={setDialogOpen}
        />
      </DialogContent>
    </Dialog>
  )
}
