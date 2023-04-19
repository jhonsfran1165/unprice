import Link from "next/link"

import { layoutConfig } from "@/lib/config/layout"
import { cn } from "@/lib/utils"
import { AccountToggle } from "@/components/accounts/account-toggle"
import { Logo } from "@/components/layout/logo"
import { OrganizationSwitch } from "@/components/organizations/organization-switch"
import ProjectContext from "@/components/projects/project-context"
import { Icons } from "@/components/shared/icons"

export function MainNav() {
  return (
    <div className="flex h-16 items-center space-x-2 bg-background-bgSubtle sm:justify-between sm:space-x-0">
      <div className="flex items-center justify-start">
        <Logo />
        <Icons.divider className="mx-3 hidden h-6 w-6 gap-0 text-background-text md:inline-block" />
        <OrganizationSwitch />
        <ProjectContext />
      </div>
      <div className="flex flex-1 items-center justify-end space-x-4">
        <nav className="flex items-center space-x-1">
          <div className="mr-3">
            {layoutConfig.mainNav?.length ? (
              <nav className="hidden gap-3 md:flex">
                {layoutConfig.mainNav.map(
                  (item, index) =>
                    item.href && (
                      <Link
                        key={index}
                        href={item.href}
                        className={cn(
                          "flex items-center rounded-md border px-2 py-1 text-xs font-normal button-ghost",
                          item.disabled && "cursor-not-allowed opacity-80"
                        )}
                      >
                        {item.title}
                      </Link>
                    )
                )}
              </nav>
            ) : null}
          </div>

          <AccountToggle />
        </nav>
      </div>
    </div>
  )
}
