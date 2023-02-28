import Link from "next/link"

import { siteConfig } from "@/config/site"
import { Icons } from "@/components/shared/icons"
import { MainNav } from "@/components/shared/layout/main-nav"
import { TabGroup } from "@/components/shared/layout/tab-group"
import { ThemeToggle } from "@/components/shared/layout/theme-toggle"
import MaxWidthWrapper from "@/components/shared/max-width-wrapper"
import { buttonVariants } from "@/components/ui/button"

export async function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-base-skin-200 bg-clip-padding backdrop-filter backdrop-blur-xl">
      <MaxWidthWrapper className="max-w-screen-2xl">
        <div className="flex h-16 items-center space-x-2 sm:justify-between sm:space-x-0">
          <MainNav items={siteConfig.mainNav} />
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-1">
              {/* TODO: use for account management */}
              <Link
                href={siteConfig.links.twitter}
                target="_blank"
                rel="noreferrer"
              >
                <div
                  className={buttonVariants({
                    size: "sm",
                    variant: "ghost",
                  })}
                >
                  <Icons.twitter className="h-5 w-5 fill-current" />
                  <span className="sr-only">User</span>
                </div>
              </Link>
              <ThemeToggle />
            </nav>
          </div>
        </div>
        {/* tabs -> convert only that part to server components? */}
        <div className="-mb-0.5 flex h-12 items-center justify-start space-x-2">
          <TabGroup />
        </div>
      </MaxWidthWrapper>
    </header>
  )
}
