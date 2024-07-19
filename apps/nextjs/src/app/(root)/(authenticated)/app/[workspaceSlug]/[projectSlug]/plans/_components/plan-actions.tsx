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

import { PlanForm } from "./plan-form"

export function PlanActions({
  plan,
}: {
  plan: RouterOutputs["plans"]["getBySlug"]["plan"]
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
        <DropdownMenuContent className="w-44" align="end">
          <DialogTrigger asChild>
            <DropdownMenuItem>Edit plan</DropdownMenuItem>
          </DialogTrigger>

          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive">Another action</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Plan Form</DialogTitle>
          <DialogDescription>Modify the plan details below.</DialogDescription>
        </DialogHeader>
        <PlanForm defaultValues={plan} />
      </DialogContent>
    </Dialog>
  )
}
