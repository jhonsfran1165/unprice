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

import { ChangePlanSubscriptionForm } from "./change-plan-subscription-form"

export function UpgradeDialog({
  defaultValues,
  children,
}: {
  defaultValues?: SubscriptionChangePlan
  children?: React.ReactNode
}) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-screen overflow-y-scroll">
        <DialogHeader>
          <DialogTitle>Upgrade Subscription</DialogTitle>

          <DialogDescription>Upgrade your subscription to a higher plan.</DialogDescription>
        </DialogHeader>

        <ChangePlanSubscriptionForm
          defaultValues={
            defaultValues ?? {
              id: "",
              customerId: "",
              endAt: 0,
              nextPlanVersionId: "",
              config: [],
              projectId: "",
            }
          }
          setDialogOpen={setDialogOpen}
        />
      </DialogContent>
    </Dialog>
  )
}
