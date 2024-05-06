"use client"

import { useState } from "react"

import type { InsertPlanVersion } from "@builderai/db/validators"
import { Button } from "@builderai/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@builderai/ui/sheet"

import { FeatureConfig } from "./feature-config"

export function PlanVersionFeatureSheet({
  defaultValues,
  children,
}: {
  label?: string
  defaultValues?: InsertPlanVersion
  children?: React.ReactNode
}) {
  // const [isOpen, setIsOpen] = useIsOpenConfigFeature()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="flex max-h-screen w-full flex-col justify-between overflow-y-scroll md:w-1/2 lg:w-[600px]">
        <SheetHeader>
          <SheetTitle className="text-2xl">
            Plan version feature form
          </SheetTitle>
          <SheetDescription>
            Make changes to your profile here. Click save when you're done.
          </SheetDescription>
        </SheetHeader>

        <FeatureConfig setDialogOpen={setIsOpen} formId="feature-config-form" />

        <div className="flex flex-col p-4">
          <div className="flex items-center">
            <Button
              type="submit"
              form="feature-config-form"
              className="ml-auto truncate"
            >
              Save configuration
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
