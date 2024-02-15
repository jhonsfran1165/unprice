import dynamic from "next/dynamic"
import Link from "next/link"

import { siteConfig } from "@builderai/config"
import { cn } from "@builderai/ui"
import { Button } from "@builderai/ui/button"
import {
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@builderai/ui/command"
import {
  Calculator,
  Calendar,
  CreditCard,
  Github,
  Settings,
  Smile,
  Twitter,
  User,
} from "@builderai/ui/icons"
import { Skeleton } from "@builderai/ui/skeleton"

import { Logo } from "~/components/logo"
import { Search } from "./search"

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
    <footer
      className={cn(
        "z-30 mx-auto flex w-full items-center justify-between gap-4 border-t bg-background-bg px-6 md:h-16 md:flex-row md:py-0",
        props.className
      )}
    >
      <div className="flex items-center gap-4 text-primary-text md:flex-row md:gap-2 md:px-0">
        <Logo />
      </div>

      <div className="flex flex-1 items-center justify-end">
        <nav className="flex items-center">
          {/* // TODO: add command for the most important actions in the platform - dev exp focused */}
          <Search>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Suggestions">
                <CommandItem>
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>Calendar</span>
                </CommandItem>
                <CommandItem>
                  <Smile className="mr-2 h-4 w-4" />
                  <span>Search Emoji</span>
                </CommandItem>
                <CommandItem>
                  <Calculator className="mr-2 h-4 w-4" />
                  <span>Calculator</span>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Settings">
                <CommandItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                  <CommandShortcut>⌘P</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Billing</span>
                  <CommandShortcut>⌘B</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                  <CommandShortcut>⌘S</CommandShortcut>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Search>

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
