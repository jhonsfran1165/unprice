import { DashboardSidebarNavItem } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Icons } from "@/components/shared/icons"
import { WrapperLink } from "@/components/shared/wrapper-link"

export function DashboardSideBarNav({
  items,
  pathPrefix,
  pathName,
}: {
  items: DashboardSidebarNavItem[]
  pathPrefix: string
  pathName: string
}) {
  if (items?.length === 0) return null

  return (
    <nav className="grid items-start gap-2">
      {items?.map((item, index) => {
        const Icon = Icons[item.icon ?? "help"]
        const active =
          pathName.replace("/root", "") === item.href ||
          pathName.replace("/root", "") === pathPrefix + item.href

        return (
          <WrapperLink
            className={""}
            key={index}
            href={item.disabled ? "#" : pathPrefix + item.href}
          >
            <div
              className={cn(
                "button-ghost group flex items-center rounded-md px-3 py-2 text-sm font-medium",
                {
                  transparent: !active,
                  "cursor-not-allowed opacity-80": item.disabled,
                }
              )}
            >
              <Icon className="mr-2 h-4 w-4 text-primary-solid" />
              <span
                className={cn({
                  "text-background-textContrast": active,
                })}
              >
                {item.title}
              </span>
            </div>
          </WrapperLink>
        )
      })}
    </nav>
  )
}
