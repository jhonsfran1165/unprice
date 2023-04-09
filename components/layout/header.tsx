import Link from "next/link"

import { layoutConfig } from "@/lib/config/layout"
import { MainNav } from "@/components/layout/main-nav"
import { TabsNav } from "@/components/layout/tabs-nav"
import MaxWidthWrapper from "@/components/shared/max-width-wrapper"

export async function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background-bgSubtle bg-clip-padding backdrop-blur-xl">
      <MaxWidthWrapper className="max-w-screen-2xl">
        <MainNav />
        <TabsNav />
      </MaxWidthWrapper>
    </header>
  )
}
