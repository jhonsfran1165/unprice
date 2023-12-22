import Link from "next/link"

import { buttonVariants } from "@builderai/ui/button"
import { ScrollArea, ScrollBar } from "@builderai/ui/scroll-area"
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipTrigger,
} from "@builderai/ui/tooltip"
import { cn } from "@builderai/ui/utils"

export type Versions = (typeof versions)[number]

export const versions = [
  "v10",
  "v9",
  "v8",
  "v7",
  "v6",
  "v5",
  "v4",
  "v3",
  "v2",
  "v1",
  "v0",
]

interface VersionProps extends React.HTMLAttributes<HTMLDivElement> {
  versions: Versions[]
  selectedVersion?: string
  basePath: string
}

export function Versions({
  className,
  versions,
  selectedVersion,
  basePath,
}: VersionProps) {
  return (
    <div
      className={cn(
        "inset-x-0 right-0 top-0 z-30 block w-16 items-center justify-start overflow-y-auto rounded-sm border-l bg-background px-2 py-20 transition-all md:right-4",
        className
      )}
    >
      <div className="flex h-full flex-col items-center justify-center">
        <ScrollArea className="flex">
          <div className="flex flex-col items-center gap-2 pt-4">
            {versions?.map((version, i) => {
              const active = selectedVersion === version
              return (
                <Tooltip key={version}>
                  <TooltipTrigger>
                    <Link
                      scroll={false}
                      href={`${basePath}/${version}/overview`}
                      prefetch={false}
                      className={cn(
                        buttonVariants({
                          variant: active ? "secondary" : "ghost",
                          size: "sm",
                        })
                      )}
                    >
                      {version}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent
                    className="bg-background-bg"
                    sideOffset={10}
                    align="center"
                    side="right"
                  >
                    Version: {version}
                    <TooltipArrow className="fill-background-bg" />
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
          <ScrollBar orientation="vertical" className="invisible" />
        </ScrollArea>
      </div>
    </div>
  )
}
