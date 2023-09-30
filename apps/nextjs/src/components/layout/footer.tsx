import dynamic from "next/dynamic"
import Link from "next/link"

import { siteConfig } from "@builderai/config"
import { cn } from "@builderai/ui"
import { Button } from "@builderai/ui/button"
import { Github, Twitter } from "@builderai/ui/icons"

import { Logo } from "~/components/layout/logo"
import MaxWidthWrapper from "~/components/max-width-wrapper"

const ThemeToggle = dynamic(() => import("~/components/layout/theme-toggle"), {
  ssr: false,
  loading: () => (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1 px-2 text-lg font-semibold md:text-base"
    >
      <div className="bg-blue h-6 w-6 animate-pulse rounded-full" />
      <span className="bg-blue w-14 animate-pulse rounded capitalize">
        &nbsp;
      </span>
    </Button>
  ),
})

export default function Footer(props: { className?: string }) {
  return (
    <footer className={cn(props.className)}>
      <div className="z-30 mt-10 flex flex-col items-center justify-between gap-4 border-t bg-background-bgSubtle py-4 md:h-16 md:flex-row md:py-0">
        <MaxWidthWrapper className="max-w-screen-2xl">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <div className="flex flex-col items-center gap-4 px-8 text-primary-text md:flex-row md:gap-2 md:px-0">
              <Logo />
            </div>

            <div className="flex flex-1 items-center justify-end">
              <nav className="flex items-center">
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
