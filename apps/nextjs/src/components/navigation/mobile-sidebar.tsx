import { Button } from "@builderai/ui/button"
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@builderai/ui/drawer"
import { cn, focusRing } from "@builderai/ui/utils"

import { User2 } from "lucide-react"
import Link from "next/link"
// import { usePathname } from "next/navigation"
import { siteConfig } from "./siteConfig"

const navigation = [
  { name: "Overview", href: siteConfig.baseLinks.overview, icon: User2 },
  { name: "Details", href: siteConfig.baseLinks.details, icon: User2 },
  {
    name: "Settings",
    href: siteConfig.baseLinks.settings,
    icon: User2,
  },
] as const

const shortcuts = [
  {
    name: "Add new user",
    href: "#",
    icon: User2,
  },
  {
    name: "Workspace usage",
    href: "#",
    icon: User2,
  },
  {
    name: "Cost spend control",
    href: "#",
    icon: User2,
  },
  {
    name: "Overview – Rows written",
    href: "#",
    icon: User2,
  },
] as const

export default function MobileSidebar() {
  // const pathname = usePathname()
  const pathname = "dasdasd"
  const isActive = (itemHref: string) => {
    if (itemHref === siteConfig.baseLinks.settings) {
      return pathname.startsWith("/settings")
    }
    return pathname === itemHref || pathname.startsWith(itemHref)
  }
  return (
    <>
      <Drawer direction="right">
        <DrawerTrigger asChild>
          <Button
            variant="ghost"
            aria-label="open sidebar"
            className="group flex items-center rounded-md p-2 text-sm font-medium hover:bg-gray-100 data-[state=open]:bg-gray-100 data-[state=open]:bg-gray-400/10 hover:dark:bg-gray-400/10"
          >
            <User2
              className="size-6 shrink-0 sm:size-5"
              aria-hidden="true"
            />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="sm:max-w-lg">
          <DrawerHeader>
            <DrawerTitle>Retail Analytics</DrawerTitle>
          </DrawerHeader>
          <DrawerBody>
            <nav
              aria-label="core mobile navigation links"
              className="flex flex-1 flex-col space-y-10"
            >
              <ul className="space-y-1.5">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <DrawerClose asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          isActive(item.href)
                            ? "text-primary"
                            : "hover:text-background-bgHover",
                          "flex items-center gap-x-2.5 rounded-md px-2 py-1.5 text-base font-medium transition hover:text-background-bgHover",
                          focusRing,
                        )}
                      >
                        <item.icon
                          className="size-5 shrink-0"
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </DrawerClose>
                  </li>
                ))}
              </ul>
              <div>
                <span className="text-sm font-medium leading-6 text-gray-500 sm:text-xs">
                  Shortcuts
                </span>
                <ul aria-label="shortcuts" className="space-y-0.5">
                  {shortcuts.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          pathname === item.href || pathname.includes(item.href)
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-gray-700 hover:text-gray-900 dark:text-gray-400 hover:dark:text-gray-50",
                          "flex items-center gap-x-2.5 rounded-md px-2 py-1.5 font-medium transition hover:bg-gray-100 sm:text-sm hover:dark:bg-gray-900",
                          focusRing,
                        )}
                      >
                        <item.icon
                          className="size-4 shrink-0"
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  )
}
