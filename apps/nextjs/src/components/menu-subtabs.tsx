import type { SubTabsRoutes } from "@builderai/config/types"
import { createIcon } from "@builderai/config/types"
import { cn } from "@builderai/ui/utils"

import SubTab from "./subtab"

export default function MenuSubTabs({
  basePath,
  activeSubTabs,
  className,
}: {
  basePath?: string
  activeSubTabs?: SubTabsRoutes
  className?: string
}) {
  if (!activeSubTabs) return null

  return (
    <>
      <div
        className={cn(
          "mb-10 inline-flex h-12 items-center border-b text-muted-foreground",
          className
        )}
      >
        {Object.entries(activeSubTabs).map(([index, item]) => {
          const Icon = item?.icon && createIcon(item?.icon)
          const href = `${basePath}/${index}`

          return (
            <SubTab
              key={index}
              className="rounded-t-lg border border-transparent px-6 py-3 text-base font-semibold"
              classNameActive="border-background-border bg-background border-b-background-base border-b-2 text-background-text"
              href={href}
              icon={Icon && <Icon className="mr-2 h-4 w-4" />}
              title={item.title}
            />
          )
        })}
      </div>
    </>
  )
}
