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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@unprice/ui/sheet"
import { MoreVertical } from "lucide-react"
import { useState } from "react"
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
  const [isOpen, setIsOpen] = useState(false)
  const [propsForm, setPropsForm] = useState<{
    isChangePlanSubscription: boolean
    readOnly: boolean
  }>({
    isChangePlanSubscription: false,
    readOnly: true,
  })

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
            <DropdownMenuItem
              onClick={() => {
                setIsOpen(true)
                setPropsForm({
                  isChangePlanSubscription: false,
                  readOnly: true,
                })
              }}
            >
              See Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setIsOpen(true)
                setPropsForm({
                  isChangePlanSubscription: true,
                  readOnly: false,
                })
              }}
            >
              Change Plan
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <SheetContent className="flex max-h-screen w-full flex-col space-y-4 overflow-y-scroll lg:w-[700px] md:w-1/2">
          <SheetHeader>
            <SheetTitle className="text-2xl">Subscription Form</SheetTitle>
            <SheetDescription>Details for this subscription</SheetDescription>
          </SheetHeader>

          <SubscriptionForm defaultValues={subscription} {...propsForm} setDialogOpen={setIsOpen} />
        </SheetContent>
      </Sheet>
    </PropagationStopper>
  )
}
