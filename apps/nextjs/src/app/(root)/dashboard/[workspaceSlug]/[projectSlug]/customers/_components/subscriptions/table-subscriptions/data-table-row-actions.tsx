"use client"

import type { Row } from "@tanstack/react-table"
import { Button } from "@unprice/ui/button"

import type { RouterOutputs } from "@unprice/trpc"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@unprice/ui/dropdown-menu"
import { MoreVertical } from "lucide-react"
import { useParams } from "next/navigation"
import { z } from "zod"
import { PropagationStopper } from "~/components/prevent-propagation"
import { SuperLink } from "~/components/super-link"
interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

type PlanVersion = RouterOutputs["plans"]["getSubscriptionsBySlug"]["subscriptions"][number]
const schemaPlanVersion = z.custom<PlanVersion>()

export function DataTableRowActions<TData>({ row }: DataTableRowActionsProps<TData>) {
  const { customer, ...subscription } = schemaPlanVersion.parse(row.original)
  const { workspaceSlug, projectSlug } = useParams()
  const subscriptionId = subscription.id

  return (
    <PropagationStopper>
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
          <DropdownMenuItem asChild>
            <SuperLink
              href={`/${workspaceSlug}/${projectSlug}/customers/subscriptions/${subscriptionId}`}
            >
              See Details
            </SuperLink>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </PropagationStopper>
  )
}
