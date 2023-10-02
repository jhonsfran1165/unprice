import dynamic from "next/dynamic"
import Link from "next/link"

import { siteConfig } from "@builderai/config"
import { cn } from "@builderai/ui"
import { Button } from "@builderai/ui/button"
import { Github, Twitter } from "@builderai/ui/icons"
import { Skeleton } from "@builderai/ui/skeleton"

import { Logo } from "~/components/logo"
import MaxWidthWrapper from "~/components/max-width-wrapper"
import { Search } from "~/components/search"

const ThemeToggle = dynamic(() => import("~/components/theme-toggle"), {
  ssr: false,
  loading: () => (
    <Button variant="ghost" size="sm" className="button-ghost">
      <Skeleton className="h-6 w-6 rounded-full" />
    </Button>
  ),
})

export default function Footer(props: { className?: string }) {
  return (
    <footer className={cn(props.className)}>
      <div className="z-30 mt-10 flex items-center justify-between gap-4 border-t bg-background-bgSubtle py-4 md:h-16 md:flex-row md:py-0">
        <MaxWidthWrapper className="max-w-screen-2xl">
          <div className="flex items-center gap-4 md:flex-row md:gap-2 md:px-0">
            <div className="flex items-center gap-4 text-primary-text md:flex-row md:gap-2 md:px-0">
              <Logo />
            </div>

            <div className="flex flex-1 items-center justify-end">
              <nav className="flex items-center">
                <Search />

                <Link
                  href={siteConfig.links.twitter}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button variant="ghost" size="sm" className="button-ghost">
                    <Twitter className="h-5 w-5 fill-current hover:text-background-textContrast" />
                    <span className="sr-only">User</span>
                  </Button>
                </Link>
                <Link
                  href={siteConfig.links.github}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button variant="ghost" size="sm" className="button-ghost">
                    <Github className="h-5 w-5 fill-current hover:text-background-textContrast" />
                    <span className="sr-only">User</span>
                  </Button>
                </Link>

                <ThemeToggle />
              </nav>
            </div>
          </div>
        </MaxWidthWrapper>
      </div>
    </footer>
  )
}
