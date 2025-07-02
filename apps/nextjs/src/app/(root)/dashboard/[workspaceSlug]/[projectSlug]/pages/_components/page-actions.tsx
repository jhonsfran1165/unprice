"use client"

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
  DropdownMenuTrigger,
} from "@unprice/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

import type { InsertPage } from "@unprice/db/validators"
import { PageForm } from "./page-form"

export function PageActions({
  page,
}: {
  page: InsertPage
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
            <DropdownMenuItem>Edit page</DropdownMenuItem>
          </DialogTrigger>
          <DialogTrigger asChild>
            <DropdownMenuItem>Publish page</DropdownMenuItem>
          </DialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent className="max-h-screen overflow-y-scroll">
        <DialogHeader>
          <DialogTitle>Plan Form</DialogTitle>
          <DialogDescription>Modify the plan details below.</DialogDescription>
        </DialogHeader>
        <PageForm defaultValues={page} />
      </DialogContent>
    </Dialog>
  )
}
