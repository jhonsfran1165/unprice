"use client"

import { useState } from "react"

import type { InsertCustomer } from "@builderai/db/validators"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@builderai/ui/dialog"

import { CustomerForm } from "./customer-form"

export function CustomerDialog({
  defaultValues,
  children,
}: {
  label?: string
  defaultValues?: InsertCustomer
  children?: React.ReactNode
}) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Customer Form</DialogTitle>

          <DialogDescription>Modify the customer details below.</DialogDescription>
        </DialogHeader>

        <CustomerForm
          defaultValues={
            defaultValues ?? {
              email: "",
              name: "",
              description: "",
            }
          }
          setDialogOpen={setDialogOpen}
        />
      </DialogContent>
    </Dialog>
  )
}
