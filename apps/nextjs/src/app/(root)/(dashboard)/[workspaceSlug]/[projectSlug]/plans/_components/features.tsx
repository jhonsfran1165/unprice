"use client"

import { Button } from "@builderai/ui/button"
import { Add, Search } from "@builderai/ui/icons"
import { Input } from "@builderai/ui/input"
import { ScrollArea } from "@builderai/ui/scroll-area"
import { Separator } from "@builderai/ui/separator"
import { cn } from "@builderai/ui/utils"

import type { Feature } from "./feature-card"
import { FeatureCard } from "./feature-card"

export const features: Feature[] = [
  {
    id: "0",
    content: "Feature test 1",
    type: "metered",
  },
  {
    id: "1",
    content: "Feature test 2",
    type: "metered",
  },
  {
    id: "2",
    content: "Feature test 3",
    type: "metered",
  },
  {
    id: "3",
    content: "Feature test 4",
    type: "metered",
  },
]

interface FeaturesProps extends React.HTMLAttributes<HTMLDivElement> {
  features: Feature[]
}

export function Features({ className, features }: FeaturesProps) {
  return (
    <div className={cn(className)}>
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
      <ScrollArea className="h-[500px] w-full">
        <div className="px-4 py-2">
          <div className="space-y-2">
            {features?.map((feature) => (
              <FeatureCard isFeature key={feature.id} feature={feature} />
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
