"use client"

import { Badge } from "@builderai/ui/badge"
import { Button } from "@builderai/ui/button"
import { Add, Search } from "@builderai/ui/icons"
import { Input } from "@builderai/ui/input"
import { ScrollArea } from "@builderai/ui/scroll-area"
import { Separator } from "@builderai/ui/separator"
import { cn } from "@builderai/ui/utils"

import { Draggable } from "./draggable"
import { SheetDemo } from "./feature-config-form"

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
  "Eminem Essentials",
  "Eminem Essentials",
  "Eminem Essentials",
  "Eminem Essentials",
  "Eminem Essentials",
  "Eminem Essentials",
  "Eminem Essentials",
  "Eminem Essentials",
  "Eminem Essentials",
  "Eminem Essentials",
  "Eminem Essentials",
]

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  features: Features[]
}

export function Features({ className, features }: SidebarProps) {
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
            {features?.map((playlist, i) => (
              <Draggable
                name={playlist}
                taskId={i.toString()}
                key={`${playlist}-${i}`}
              >
                <div
                  className={
                    "flex flex-col items-start gap-4 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent"
                  }
                >
                  <div className="flex w-full flex-col gap-1">
                    <div className="flex items-center">
                      <div className="font-semibold">{playlist}</div>
                      <div className={cn("ml-auto")}>
                        <SheetDemo />
                      </div>
                    </div>
                    <div className="text-xs font-medium">
                      1000 calls per $5 USD
                    </div>
                  </div>

                  <div className="flex w-full items-center justify-end gap-2">
                    <Badge variant={"outline"}>metered</Badge>
                  </div>
                </div>
              </Draggable>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
