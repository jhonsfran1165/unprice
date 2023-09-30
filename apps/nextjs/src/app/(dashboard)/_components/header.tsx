import { Suspense } from "react"
import Link from "next/link"

import { siteConfig } from "@builderai/config"
import { cn } from "@builderai/ui"
import * as Icons from "@builderai/ui/icons"

import { Search } from "~/components/layout/search"
import { TabsNav } from "~/components/layout/tabs-nav"
import MaxWidthWrapper from "~/components/max-width-wrapper"
import { UserNav } from "~/components/user-nav"
import { api } from "~/trpc/server"
import { ProjectSwitcher } from "../_components/project-switcher"
import { WorkspaceSwitcher } from "../_components/workspace-switcher"

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background-bgSubtle bg-clip-padding backdrop-blur-xl">
      <MaxWidthWrapper className="max-w-screen-2xl">
        <div className="flex h-16 items-center space-x-2 bg-background-bgSubtle sm:justify-between sm:space-x-0">
          <div className="flex items-center justify-start">
            <Link href="/">
              <Icons.Logo />
            </Link>
            <span className="mx-2 text-lg font-bold text-muted-foreground">
              /
            </span>
            <WorkspaceSwitcher />
            <Suspense>
              <ProjectSwitcher
                projectsPromise={api.project.listByActiveWorkspace.query()}
              />
            </Suspense>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <div className="mr-3">
              {siteConfig.mainNav?.length ? (
                <nav className="hidden gap-3 md:flex">
                  {siteConfig.mainNav.map(
                    (item, index) =>
                      item.href && (
                        <Link
                          key={item.href + index}
                          href={item.href}
                          className={cn(
                            "button-ghost flex items-center rounded-md border px-2 py-1 text-xs font-normal",
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

            <Search />
            <UserNav />
          </div>
        </div>
        <TabsNav />
      </MaxWidthWrapper>
    </header>
  )
}
