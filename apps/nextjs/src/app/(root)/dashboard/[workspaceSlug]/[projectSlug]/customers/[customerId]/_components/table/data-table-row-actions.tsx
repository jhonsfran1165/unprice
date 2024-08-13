"use client"

import type { Row } from "@tanstack/react-table"

import { subscriptionSelectSchema } from "@unprice/db/validators"
import { Button } from "@unprice/ui/button"
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
import { useState } from "react"
import { PropagationStopper } from "~/components/prevent-propagation"
import { SubscriptionForm } from "../../../../subscriptions/_components/subscription-form"

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

export function DataTableRowActions<TData>({ row }: DataTableRowActionsProps<TData>) {
  const subscription = subscriptionSelectSchema.parse(row.original)
  const [isOpen, setIsOpen] = useState(false)

  return (
    <PropagationStopper>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
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
            <DropdownMenuItem>Downgrade/Upgrade</DropdownMenuItem>
            <SheetTrigger asChild>
              <DropdownMenuItem>End Subscription</DropdownMenuItem>
            </SheetTrigger>
          </DropdownMenuContent>
        </DropdownMenu>

        <SheetContent className="flex max-h-screen w-full flex-col space-y-4 overflow-y-scroll lg:w-[700px] md:w-1/2">
          <SheetHeader>
            <SheetTitle className="text-2xl">Subscription End Form</SheetTitle>
            <SheetDescription>End the current subscription for this customer</SheetDescription>
          </SheetHeader>

          <SubscriptionForm
            defaultValues={subscription}
            isChangePlanSubscription
            setDialogOpen={setIsOpen}
          />
        </SheetContent>
      </Sheet>
    </PropagationStopper>
  )
}
