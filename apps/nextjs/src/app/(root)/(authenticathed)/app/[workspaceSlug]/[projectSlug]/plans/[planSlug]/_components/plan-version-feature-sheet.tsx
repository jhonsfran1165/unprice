"use client"

import { useState } from "react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@builderai/ui/sheet"

import { usePlanVersionFeatureOpen } from "../../_components/use-features"
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
      onOpenChange={(open) => {
        setIsOpen(open)
        setPlanVersionFeatureOpen(open)
      }}
    >
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="flex max-h-screen w-full flex-col justify-between overflow-y-scroll md:w-1/2 lg:w-[600px]">
        <SheetHeader>
          <SheetTitle className="text-2xl">
            Plan version feature form
          </SheetTitle>
          <SheetDescription>
            Configure the feature for the plan version
          </SheetDescription>
        </SheetHeader>

        <FeatureConfig setDialogOpen={setIsOpen} />
      </SheetContent>
    </Sheet>
  )
}
