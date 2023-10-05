"use client"

import { AnimatePresence, motion } from "framer-motion"

import type { DashboardRoute } from "@builderai/config"
import { cn } from "@builderai/ui"
import * as Icons from "@builderai/ui/icons"
import { ScrollArea, ScrollBar } from "@builderai/ui/scroll-area"

import { Tab } from "~/components/tab"
import { useGetPaths } from "~/lib/use-get-path"
import useScroll from "~/lib/use-scroll"

export default function TabsNav(props: {
  className?: string
  moduleRoutes: DashboardRoute[]
  activeRoute: DashboardRoute | null
}) {
  const { baseUrl } = useGetPaths()
  const scrolled = useScroll(60)

  const routes = props.moduleRoutes
  const activeRoute = props.activeRoute

  return (
    <div
      className={cn(
        "sticky inset-x-0 top-0 z-30 flex h-12 w-full items-center justify-start border-b px-2 transition-all",
        props.className,
        {
          "bg-background backdrop-blur-lg": scrolled,
        }
      )}
    >
      <ScrollArea className="-mb-1.5 h-12 max-w-[600px] lg:max-w-none">
        <nav className="flex w-auto items-center gap-2">
          <AnimatePresence mode="wait">
            {scrolled ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ rotate: 180, scale: 1 }}
                exit={{
                  rotate: -180,
                  scale: 0,
                }}
                transition={{
                  stiffness: 260,
                  damping: 20,
                  ease: "easeOut",
                  duration: 0.2,
                }}
              >
                <Icons.Logo className={"mr-4 h-6 w-6"} />
              </motion.div>
            ) : (
              <Icons.Logo
                className={cn(
                  "mx-2 h-6 w-6 text-transparent transition-all animate-out duration-1000",
                  {
                    hidden: !scrolled,
                  }
                )}
              />
            )}
          </AnimatePresence>
          {routes.map((route, index) => (
            <Tab
              key={baseUrl + route.slug + index}
              route={route}
              baseUrl={baseUrl}
              activeRoute={activeRoute}
            />
          ))}
        </nav>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    </div>
  )
}
