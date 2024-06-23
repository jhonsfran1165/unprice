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
        <PlanForm defaultValues={plan} />
      </DialogContent>
    </Dialog>
  )
}
