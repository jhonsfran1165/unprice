"use client"

import { Button } from "@builderai/ui/button"
import { Add, Search } from "@builderai/ui/icons"
import { Input } from "@builderai/ui/input"
import { ScrollArea, ScrollBar } from "@builderai/ui/scroll-area"
import { Separator } from "@builderai/ui/separator"
import { cn } from "@builderai/ui/utils"

import { SortableFeature } from "./sortable-feature"
import type { Feature } from "./types"

interface FeaturesProps extends React.HTMLAttributes<HTMLDivElement> {
  features: Feature[]
}

export function Features({ className, features }: FeaturesProps) {
  return (
    <div className={cn("flex flex-1 flex-col overflow-y-auto", className)}>
      <div className="flex items-center px-4 py-2">
        <h1 className="text-xl font-bold">Features</h1>
      </div>
      <Separator />
      <div className="flex flex-row items-center space-x-1 p-4 backdrop-blur">
        <form className="w-full">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search" className="h-8 pl-8" />
          </div>
        </form>
        <Button className="h-8 w-8" size={"icon"} variant={"ghost"}>
          <Add className="h-5 w-5" />
        </Button>
      </div>
      <ScrollArea className="max-h-[750px] flex-1 overflow-y-auto">
        <div className="px-4 py-2">
          <div className="space-y-2">
            {features?.map((feature) => (
              <SortableFeature isFeature key={feature.id} feature={feature} />
            ))}
          </div>
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </div>
  )
}
