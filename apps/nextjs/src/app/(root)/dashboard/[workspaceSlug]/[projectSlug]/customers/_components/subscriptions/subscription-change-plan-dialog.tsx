"use client"

import { useState } from "react"

import type { SubscriptionChangePlan } from "@unprice/db/validators"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@unprice/ui/dialog"

import SubscriptionChangePlanForm from "./subscription-change-plan-form"

export function SubscriptionChangePlanDialog({
  defaultValues,
  children,
}: {
  label?: string
  defaultValues?: SubscriptionChangePlan
  children?: React.ReactNode
}) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-screen overflow-y-scroll">
        <DialogHeader>
          <DialogTitle>Change Plan</DialogTitle>

          <DialogDescription>Change the plan of the subscription.</DialogDescription>
        </DialogHeader>

        <SubscriptionChangePlanForm
          defaultValues={
            defaultValues ?? {
              id: "",
              projectId: "",
              planVersionId: "",
              config: [],
              whenToChange: "immediately",
              currentCycleEndAt: Date.now(),
              timezone: "",
            }
          }
          setDialogOpen={setDialogOpen}
        />
      </DialogContent>
    </Dialog>
  )
}
