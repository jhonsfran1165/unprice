"use client"

import type { Row } from "@tanstack/react-table"
import { Button } from "@unprice/ui/button"

import type { RouterOutputs } from "@unprice/api"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@unprice/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@unprice/ui/sheet"
import { MoreVertical } from "lucide-react"
import { z } from "zod"
import { PropagationStopper } from "~/components/prevent-propagation"
import { SubscriptionForm } from "../../../../subscriptions/_components/subscription-form"
interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

type PlanVersion = RouterOutputs["plans"]["getSubscriptionsBySlug"]["subscriptions"][number]
const schemaPlanVersion = z.custom<PlanVersion>()

export function DataTableRowActions<TData>({ row }: DataTableRowActionsProps<TData>) {
  const { version, customer, ...subscription } = schemaPlanVersion.parse(row.original)

  return (
    <PropagationStopper>
      <Sheet>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button aria-haspopup="true" size="icon" variant="ghost">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <SheetTrigger asChild>
              <DropdownMenuItem>Sub Details</DropdownMenuItem>
            </SheetTrigger>
          </DropdownMenuContent>
        </DropdownMenu>

        <SheetContent className="flex max-h-screen w-full flex-col space-y-4 overflow-y-scroll lg:w-[700px] md:w-1/2">
          <SheetHeader>
            <SheetTitle className="text-2xl">Subscription Form</SheetTitle>
            <SheetDescription>Details for this subscription</SheetDescription>
          </SheetHeader>

          <SubscriptionForm defaultValues={subscription} readOnly />
        </SheetContent>
      </Sheet>
    </PropagationStopper>
  )
}
