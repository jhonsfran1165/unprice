"use client"

import { Badge } from "@builderai/ui/badge"
import { Input } from "@builderai/ui/input"
import { ScrollArea } from "@builderai/ui/scroll-area"
import { Separator } from "@builderai/ui/separator"
import { cn } from "@builderai/ui/utils"

import { Draggable } from "./draggable"

export type Features = (typeof features)[number]

export const features = [
  "Recently Added",
  "Recently Played",
  "Top Songs",
  "Top Albums",
  "Top Artists",
  "Logic Discography",
  "Bedtime Beats",
  "Feeling Happy",
  "I miss Y2K Pop",
  "Runtober",
  "Mellow Days",
  "Eminem Essentials",
]

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  features: Features[]
}

export function Features({ className, features }: SidebarProps) {
  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            All Features
          </h2>
          <div className="space-y-1 px-2">
            <Input placeholder="Search feature" />
          </div>
        </div>
        <Separator />
        <div className="py-2">
          <h2 className="relative px-7 text-lg font-semibold tracking-tight">
            Results...
          </h2>
          <ScrollArea className="h-[400px] px-1">
            <div className="z-50 space-y-1 p-2 ">
              {features?.map((playlist, i) => (
                <Draggable
                  name={playlist}
                  taskId={i.toString()}
                  key={`${playlist}-${i}`}
                  isOverlay
                >
                  <Badge variant={"outline"} className="ml-auto font-semibold">
                    {playlist}
                  </Badge>
                </Draggable>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
