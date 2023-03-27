import Link from "next/link"

import { layoutConfig } from "@/lib/config/layout"
import { AccountToggle } from "@/components/accounts/account-toggle"
import { MainNav } from "@/components/layout/main-nav"
import { TabsNav } from "@/components/layout/tabs-nav"
import { Icons } from "@/components/shared/icons"
import MaxWidthWrapper from "@/components/shared/max-width-wrapper"
import { Button } from "@/components/ui/button"

export async function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-clip-padding bg-background-bgSubtle backdrop-filter backdrop-blur-xl">
      <MaxWidthWrapper className="max-w-screen-2xl">
        <div className="flex h-16 items-center space-x-2 sm:justify-between sm:space-x-0">
          <MainNav items={layoutConfig.mainNav} />
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-1">
              {/* TODO: use for account management */}
              <Link
                href={layoutConfig.links.twitter}
                target="_blank"
                rel="noreferrer"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="active:bg-background-bgActive hover:bg-background-bgHover"
                >
                  <Icons.twitter className="h-5 w-5 fill-current hover:text-background-textContrast" />
                  <span className="sr-only">User</span>
                </Button>
              </Link>

              <AccountToggle />
            </nav>
          </div>
        </div>
        <TabsNav />
      </MaxWidthWrapper>
    </header>
  )
}
