"use client"

import { useState } from "react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@unprice/ui/sheet"

import { usePlanVersionFeatureOpen } from "~/hooks/use-features"
import { FeatureConfig } from "./feature-config"

export function PlanVersionFeatureSheet({
  children,
}: {
  label?: string
  children?: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [_, setPlanVersionFeatureOpen] = usePlanVersionFeatureOpen()

  return (
    <Sheet
      open={isOpen}
      // TODO: there is an issue here when opening the sheet
      onOpenChange={(open) => {
        setIsOpen(open)
        setPlanVersionFeatureOpen(open)
      }}
    >
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="flex max-h-screen w-full flex-col justify-between overflow-y-scroll lg:w-[600px] md:w-1/2">
        <SheetHeader>
          <SheetTitle className="text-2xl">Plan version feature form</SheetTitle>
          <SheetDescription>Configure the feature for the plan version</SheetDescription>
        </SheetHeader>

        <FeatureConfig
          setDialogOpen={(open) => {
            setIsOpen(open)
            setPlanVersionFeatureOpen(open)
          }}
        />
      </SheetContent>
    </Sheet>
  )
}
