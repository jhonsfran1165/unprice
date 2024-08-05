"use client"

import type { Row } from "@tanstack/react-table"

import { planVersionSelectBaseSchema } from "@unprice/db/validators"
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@unprice/ui/dropdown-menu"
import { MoreVertical } from "lucide-react"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { SuperLink } from "~/components/super-link"
import { PlanVersionDuplicate } from "../../../_components/plan-version-actions"
import { PlanVersionForm } from "../plan-version-form"

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

export function DataTableRowActions<TData>({ row }: DataTableRowActionsProps<TData>) {
  const pathname = usePathname()
  const version = planVersionSelectBaseSchema.parse(row.original)
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog>
      <DropdownMenu onOpenChange={setIsOpen} open={isOpen}>
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
            <DropdownMenuItem>Edit version</DropdownMenuItem>
          </DialogTrigger>
          <DropdownMenuItem asChild>
            <PlanVersionDuplicate
              onConfirmAction={() => setIsOpen(false)}
              classNames="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-background-bgHover"
              planVersionId={version.id}
            />
          </DropdownMenuItem>

          <DropdownMenuItem>
            <SuperLink href={`${pathname}/${version.id}`}>Configure features</SuperLink>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DialogContent className="max-h-screen overflow-y-scroll md:max-w-screen-md">
        <DialogHeader>
          <DialogTitle>Plan Version Form</DialogTitle>
          <DialogDescription>Modify the plan version details below.</DialogDescription>
        </DialogHeader>
        <PlanVersionForm defaultValues={version} />
      </DialogContent>
    </Dialog>
  )
}
