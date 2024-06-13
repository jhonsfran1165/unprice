"use client"

import { ChevronDown } from "lucide-react"

import type { RouterOutputs } from "@builderai/api"
import { Button } from "@builderai/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@builderai/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@builderai/ui/dropdown-menu"

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
        <CustomerForm defaultValues={customer} />
      </DialogContent>
    </Dialog>
  )
}