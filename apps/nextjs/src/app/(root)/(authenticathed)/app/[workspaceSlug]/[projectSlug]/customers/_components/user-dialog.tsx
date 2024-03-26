"use client"

import { useState } from "react"

import type { InsertCustomer } from "@builderai/db/validators"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@builderai/ui/dialog"

import { UserForm } from "./user-form"

export function UserDialog({
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
          <DialogTitle>{"Feature Data"}</DialogTitle>
        </DialogHeader>

        <UserForm
          defaultValues={
            defaultValues ?? {
              email: "",
              name: "",
              id: "",
            }
          }
          setDialogOpen={setDialogOpen}
        />
      </DialogContent>
    </Dialog>
  )
}
