import { cookies } from "next/headers"
import Link from "next/link"
import type { ReactNode } from "react"
import { Suspense } from "react"

import { buttonVariants } from "@builderai/ui/button"
import { ChevronRight, Logo } from "@builderai/ui/icons"

import Footer from "~/components/layout/footer"
import { MainNav } from "~/components/layout/main-nav"
import MaxWidthWrapper from "~/components/layout/max-width-wrapper"
import { APP_DOMAIN, AUTH_ROUTES } from "~/constants"
import { siteConfig } from "~/constants/layout"

export default function MarketingLayout(props: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <nav className="z-50 flex h-16 items-center border-b bg-background">
        <MaxWidthWrapper className="flex max-w-screen-2xl">
          <div className="mr-8 hidden items-center md:flex">
            <Logo className="mr-2 h-6 w-6" />
            <span className="font-bold text-lg tracking-tight">{siteConfig.name}</span>
          </div>

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
          href={`${APP_DOMAIN}${AUTH_ROUTES.SIGNIN}`}
          className={buttonVariants({ variant: "outline" })}
        >
          Sign In
          <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </>
    )
  }

  return (
    <Link href={`${APP_DOMAIN}${workspaceSlug}`} className={buttonVariants({ variant: "outline" })}>
      Dashboard
      <ChevronRight className="ml-1 h-4 w-4" />
    </Link>
  )
}
