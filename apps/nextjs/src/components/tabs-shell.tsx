"use client"

import { AnimatePresence, domAnimation, LazyMotion, m } from "framer-motion"

import type { DashboardRoute } from "@builderai/config/types"
import { Logo } from "@builderai/ui/icons"
import { ScrollArea, ScrollBar } from "@builderai/ui/scroll-area"
import { cn } from "@builderai/ui/utils"

import { useGetPaths } from "~/lib/use-get-path"
import useScroll from "~/lib/use-scroll"

export default function TabsShell(props: {
  moduleTabs: DashboardRoute[]
  activeRoute: DashboardRoute | null
  children: React.ReactNode
}) {
  const { baseUrl } = useGetPaths()
  const scrolled = useScroll(60)

  return (
    <ScrollArea className="-mb-1.5 h-12 max-w-[600px] lg:max-w-none">
      <nav className="flex w-auto items-center gap-2">
        <AnimatePresence mode="wait">
          {scrolled ? (
            <LazyMotion features={domAnimation}>
              <m.div
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
                <Logo className={"mr-4 h-6 w-6"} />
              </m.div>
            </LazyMotion>
          ) : (
            <Logo
              className={cn(
                "mx-2 h-6 w-6 text-transparent transition-all animate-out duration-1000",
                {
                  hidden: !scrolled,
                }
              )}
            />
          )}
        </AnimatePresence>
        {props.children}
      </nav>
      <ScrollBar orientation="horizontal" className="invisible" />
    </ScrollArea>
  )
}
