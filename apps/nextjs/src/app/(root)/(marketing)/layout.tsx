import type { ReactNode } from "react"
import { Suspense } from "react"
import { cookies } from "next/headers"
import Link from "next/link"

import { Button, buttonVariants } from "@builderai/ui/button"
import { ChevronRight, Logo } from "@builderai/ui/icons"
import { ScrollArea } from "@builderai/ui/scroll-area"

import Footer from "~/components/layout/footer"
import { MainNav } from "~/components/layout/main-nav"
import MaxWidthWrapper from "~/components/layout/max-width-wrapper"
import { MobileDropdown } from "~/components/layout/mobile-nav"
import { APP_DOMAIN, AUTH_ROUTES } from "~/constants"
import { navItems, siteConfig } from "~/constants/layout"

export default function MarketingLayout(props: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <nav className="z-50 flex h-16 items-center border-b bg-background">
        <MaxWidthWrapper className="flex max-w-screen-2xl">
          <div className="mr-8 hidden items-center md:flex">
            <Logo className="mr-2 h-6 w-6" />
            <span className="text-lg font-bold tracking-tight">
              {siteConfig.name}
            </span>
          </div>
          <Suspense>
            {/* TODO: fix this -> pass as much props as possible to MobileDropdown */}
            <MobileDropdown
              mobileButton={
                <Button
                  variant="ghost"
                  className="mr-2 px-0 hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
                >
                  <Logo className="mr-2 h-6 w-6" />
                  <span className="text-lg font-bold tracking-tight">
                    {siteConfig.name}
                  </span>
                </Button>
              }
              navTabs={
                <ScrollArea className="py-8">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      // className="mt-2 flex items-center text-lg font-semibold sm:text-sm"
                      className="flex py-1 text-base font-medium text-muted-foreground transition-colors hover:text-primary"
                    >
                      {item.title}
                    </Link>
                  ))}
                </ScrollArea>
              }
            />
          </Suspense>
          <MainNav />
          <div className="ml-auto flex items-center space-x-4">
            <Suspense>
              <DashboardLink />
            </Suspense>
          </div>
        </MaxWidthWrapper>
      </nav>

      <main className="flex-1">{props.children}</main>
      <Footer />
    </div>
  )
}

function DashboardLink() {
  const workspaceSlug = cookies().get("workspaceSlug")?.value

  if (!workspaceSlug) {
    return (
      <>
        <Link
          href={`${APP_DOMAIN}/${AUTH_ROUTES.SIGNIN}`}
          className={buttonVariants({ variant: "outline" })}
        >
          Sign In
          <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </>
    )
  }

  return (
    <Link
      href={`${APP_DOMAIN}/${workspaceSlug}`}
      className={buttonVariants({ variant: "outline" })}
    >
      Dashboard
      <ChevronRight className="ml-1 h-4 w-4" />
    </Link>
  )
}
