import dynamic from "next/dynamic"
import Link from "next/link"

import { siteConfig } from "@builderai/config"
import { Button } from "@builderai/ui/button"
import { Github, Twitter } from "@builderai/ui/icons"
import { Skeleton } from "@builderai/ui/skeleton"
import { cn } from "@builderai/ui/utils"

import { Logo } from "~/components/logo"

const ThemeToggle = dynamic(() => import("~/components/theme-toggle"), {
  ssr: false,
  loading: () => (
    <Button variant="ghost" size="sm" className="button-ghost">
      <Skeleton className="h-6 w-6 rounded-full" />
    </Button>
  ),
})

const Search = dynamic(() => import("~/components/search"), {
  ssr: false,
})

export default function Footer(props: { className?: string }) {
  return (
    <footer
      className={cn(
        "z-30 mx-auto mt-10 flex w-full items-center justify-between gap-4 border-t bg-background-bg px-6 md:h-16 md:flex-row md:py-0",
        props.className
      )}
    >
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
          <Link href={siteConfig.links.github} target="_blank" rel="noreferrer">
            <Button variant="ghost" size="sm" className="button-ghost">
              <Github className="h-5 w-5 fill-current hover:text-background-textContrast" />
              <span className="sr-only">User</span>
            </Button>
          </Link>

          <ThemeToggle />
        </nav>
      </div>
    </footer>
  )
}
