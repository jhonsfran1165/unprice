"use client"

import { useState } from "react"

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

import type { Page } from "@unprice/db/validators"
import { PageForm } from "./page-form"
import { PagePublish } from "./page-publish"

export function PageActions({
  page,
}: {
  page: Page
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isOpenDialog, setIsOpenDialog] = useState(false)

  return (
    <Dialog onOpenChange={setIsOpenDialog} open={isOpenDialog}>
      <DropdownMenu onOpenChange={setIsOpen} open={isOpen}>
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
            <DropdownMenuItem asChild>
              <PagePublish
                pageId={page.id}
                variant="custom"
                onConfirmAction={() => setIsOpen(false)}
                classNames="w-full relative flex cursor-pointer justify-start select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-background-bgHover hover:text-background-textContrast font-normal"
              />
            </DropdownMenuItem>
          </DialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent className="max-h-screen overflow-y-scroll">
        <DialogHeader>
          <DialogTitle>Plan Form</DialogTitle>
          <DialogDescription>Modify the plan details below.</DialogDescription>
        </DialogHeader>
        <PageForm defaultValues={page} setDialogOpen={setIsOpenDialog} />
      </DialogContent>
    </Dialog>
  )
}
