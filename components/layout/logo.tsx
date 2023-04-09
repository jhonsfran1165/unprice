import Link from "next/link"

import { layoutConfig } from "@/lib/config/layout"
import { Icons } from "@/components/shared/icons"

export function Logo() {
  return (
    <div className="hidden items-center space-x-2 text-primary-text md:flex">
      <Icons.logo className="h-6 w-6" />
      <span className="hidden font-bold sm:inline-block">
        {layoutConfig.name}
      </span>
    </div>
  )
}
