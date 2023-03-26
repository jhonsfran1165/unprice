import { layoutConfig } from "@/lib/config/layout"
import { Icons } from "@/components/shared/icons"

export function LoadingLogo() {
  return (
    <div className="flex h-screen w-screen items-center justify-center animate-pulse space-x-2">
      <Icons.logo className="h-6 w-6" />
      <span className="hidden font-bold sm:inline-block">
        {layoutConfig.name}
      </span>
    </div>
  )
}
