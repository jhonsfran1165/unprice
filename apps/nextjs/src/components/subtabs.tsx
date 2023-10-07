import type { SubTabsRoutes } from "@builderai/config"
import { createIcon } from "@builderai/config"

import SubTab from "~/components/subtab"

export default function SubTabs({
  activeRouteSlug,
  activeSubTabs,
  baseUrl,
}: {
  activeSubTabs: SubTabsRoutes
  activeRouteSlug: string
  baseUrl: string
}) {
  return (
    <div className="mb-4 inline-flex h-10 items-center rounded-md bg-muted p-1 text-muted-foreground">
      {Object.entries(activeSubTabs).map(([index, item]) => {
        const Icon = item?.icon && createIcon(item?.icon)
        const href =
          activeRouteSlug === index ? `${baseUrl}` : `${baseUrl}/${index}`

        return (
          <SubTab
            key={index}
            href={href}
            icon={Icon && <Icon className="mr-2 h-4 w-4" />}
            title={item.title}
          />
        )
      })}
    </div>
  )
}
