"use client"

import { ChevronDown } from "lucide-react"

import type { RouterOutputs } from "@unprice/api"
import { Button } from "@unprice/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@unprice/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@unprice/ui/dropdown-menu"

import { CustomerForm } from "./customer-form"

export function CustomerActions({
  customer,
}: {
  customer: RouterOutputs["customers"]["getById"]["customer"]
}) {
  return (
    <Dialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={"custom"}>
            <span className="sr-only">Actions</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DialogTrigger asChild>
            <DropdownMenuItem>Edit customer</DropdownMenuItem>
          </DialogTrigger>

          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive">Another action</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Customer Form</DialogTitle>
          <DialogDescription>Modify the customer details below.</DialogDescription>
        </DialogHeader>
        <CustomerForm defaultValues={customer} />
      </DialogContent>
    </Dialog>
  )
}
