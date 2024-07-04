import dynamic from "next/dynamic"
import Link from "next/link"

import { Button } from "@builderai/ui/button"
import { Github, Twitter } from "@builderai/ui/icons"
import { Skeleton } from "@builderai/ui/skeleton"
import { cn } from "@builderai/ui/utils"

import { Logo } from "~/components/layout/logo"
import { siteConfig } from "~/constants/layout"

const ThemeToggle = dynamic(() => import("~/components/layout/theme-toggle"), {
  ssr: false,
  loading: () => (
    <Button variant="ghost" size="sm" className="button-ghost">
      <Skeleton className="h-6 w-6 rounded-full" />
    </Button>
  ),
})

export default function Footer(props: { className?: string }) {
  return (
    <footer
      className={cn(
        "bg-background-bgSubtle z-30 mx-auto flex w-full items-center justify-between gap-4 border-t px-6 md:h-16 md:flex-row md:py-0",
        props.className
      )}
    >
      <div className="text-primary-text flex items-center gap-4 md:flex-row md:gap-2 md:px-0">
        <Logo />
      </div>

      <div className="flex flex-1 items-center justify-end">
        <nav className="flex items-center">
          {/* // TODO: add command for the most important actions in the platform - dev exp focused */}
          <Link href={siteConfig.links.twitter} target="_blank" rel="noreferrer">
            <Button variant="ghost" size="sm" className="button-ghost">
              <Twitter className="hover:text-background-textContrast h-5 w-5 fill-current" />
              <span className="sr-only">User</span>
            </Button>
          </Link>
          <Link href={siteConfig.links.github} target="_blank" rel="noreferrer">
            <Button variant="ghost" size="sm" className="button-ghost">
              <Github className="hover:text-background-textContrast h-5 w-5 fill-current" />
              <span className="sr-only">User</span>
            </Button>
          </Link>

          <ThemeToggle />
        </nav>
      </div>
    </footer>
  )
}
