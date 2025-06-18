"use client"

import type { Row } from "@tanstack/react-table"

import { planSelectBaseSchema, planVersionSelectBaseSchema } from "@unprice/db/validators"
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
import {
  PlanVersionDeactivate,
  PlanVersionDuplicate,
  PlanVersionPublish,
} from "../../../_components/plan-version-actions"
import { PlanVersionForm } from "../plan-version-form"

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

export function DataTableRowActions<TData>({ row }: DataTableRowActionsProps<TData>) {
  const pathname = usePathname()
  // parse to get the types
  const version = planVersionSelectBaseSchema
    .extend({
      plan: planSelectBaseSchema.pick({ defaultPlan: true }),
    })
    .parse(row.original)
  const [isOpen, setIsOpen] = useState(false)
  const [isOpenDialog, setIsOpenDialog] = useState(false)

  return (
    <Dialog onOpenChange={setIsOpenDialog} open={isOpenDialog}>
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
              classNames="w-full relative flex cursor-pointer justify-start select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-background-bgHover hover:text-background-textContrast font-normal"
              planVersionId={version.id}
            />
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <PlanVersionPublish
              variant="custom"
              onConfirmAction={() => setIsOpen(false)}
              classNames="w-full relative flex cursor-pointer justify-start select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-background-bgHover hover:text-background-textContrast font-normal"
              planVersionId={version.id}
            />
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <PlanVersionDeactivate
              onConfirmAction={() => setIsOpen(false)}
              classNames="w-full relative flex cursor-pointer justify-start select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-background-bgHover hover:text-background-textContrast font-normal"
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
        <PlanVersionForm
          defaultValues={{
            ...version,
            isDefault: version.plan.defaultPlan ?? false,
          }}
          setDialogOpen={setIsOpenDialog}
        />
      </DialogContent>
    </Dialog>
  )
}
