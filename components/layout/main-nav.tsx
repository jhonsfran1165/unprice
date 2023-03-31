import Link from "next/link"

import { layoutConfig } from "@/lib/config/layout"
import { cn } from "@/lib/utils"
import { AccountToggle } from "@/components/accounts/account-toggle"
import { Logo } from "@/components/layout/logo"
import { OrganizationToggle } from "@/components/organizations/organization-toggle"
import ProjectContext from "@/components/projects/project-context"
import { Icons } from "@/components/shared/icons"

export function MainNav() {
  return (
    <div className="bg-background-bgSubtle flex h-16 items-center space-x-2 sm:justify-between sm:space-x-0">
      <div className="flex items-center justify-start">
        <Logo />
        <Icons.divider className="hidden h-6 w-6 mx-3 text-background-text gap-0 md:inline-block" />
        <OrganizationToggle />
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
                          "flex items-center rounded-md border font-normal text-xs px-2 py-1 hover:bg-background-bgHover active:bg-background-bgActive hover:text-background-textContrast",
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
