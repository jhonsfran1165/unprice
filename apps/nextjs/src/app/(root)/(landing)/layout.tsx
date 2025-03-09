import { APP_DOMAIN } from "@unprice/config"
import { Badge } from "@unprice/ui/badge"
import { buttonVariants } from "@unprice/ui/button"
import { ChevronRight } from "@unprice/ui/icons"
import { cn } from "@unprice/ui/utils"
import { Link } from "next-view-transitions"
import type { ReactNode } from "react"
import Footer from "~/components/layout/footer"
import { Logo } from "~/components/layout/logo"
import { MainNav } from "~/components/layout/main-nav"
import { SearchTool } from "~/components/layout/search"
import ThemeToggle from "~/components/layout/theme-toggle"

export default function MarketingLayout(props: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header
        className={cn(
          "sticky top-0 z-40 flex h-16 items-center border-b bg-background-base px-2 shadow-sm backdrop-blur-[2px]"
        )}
      >
        <div className="flex h-14 w-full items-center space-x-2 sm:justify-between sm:space-x-0">
          <div className="flex items-center justify-start">
            <Logo /> <Badge variant="secondary" className="ml-2">Beta</Badge>
          </div>

          <div className="flex flex-1 items-center justify-end space-x-2">
            <MainNav />
            <SearchTool className="hidden" />
            <ThemeToggle />
            <div className="ml-auto flex items-center space-x-4">
              <Link href={`${APP_DOMAIN}`} className={buttonVariants({ variant: "primary" })}>
                Login
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="hide-scrollbar flex-1 overflow-y-auto">{props.children}</main>
      <Footer />
    </div>
  )
}
