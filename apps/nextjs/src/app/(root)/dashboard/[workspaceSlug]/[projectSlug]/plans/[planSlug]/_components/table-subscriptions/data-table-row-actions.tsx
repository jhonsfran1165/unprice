"use client"

import type { Row } from "@tanstack/react-table"
import { Button } from "@unprice/ui/button"

import { DialogTrigger } from "@unprice/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@unprice/ui/dropdown-menu"
import { MoreVertical } from "lucide-react"

import type { RouterOutputs } from "@unprice/api"
import { z } from "zod"
interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

type PlanVersion = RouterOutputs["plans"]["getSubscriptionsBySlug"]["subscriptions"][number]
const schemaPlanVersion = z.custom<PlanVersion>()

export function DataTableRowActions<TData>({ row }: DataTableRowActionsProps<TData>) {
  const data = schemaPlanVersion.parse(row.original)

  return (
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
        <DialogTrigger asChild>
          <DropdownMenuItem>Edit version {data.version.version}</DropdownMenuItem>
        </DialogTrigger>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
