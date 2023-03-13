import { layoutConfig } from "@/lib/config/layout"
import { Icons } from "@/components/shared/icons"
import MaxWidthWrapper from "@/components/shared/max-width-wrapper"

export function Footer() {
  return (
    <footer>
      <div className="fixed min-w-full bottom-0 flex flex-col items-center justify-between gap-4 border-t bg-background-bgSubtle py-4 z-30 mt-10 md:h-16 md:flex-row md:py-0">
        <MaxWidthWrapper className="max-w-screen-2xl">
          <div className="flex flex-col items-center text-primary-text gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <Icons.logo className="hidden md:block h-6 w-6" />
            <p className="text-center text-sm text-primary-text font-bold leading-loose md:text-left">
              {layoutConfig.name}
            </p>
          </div>
        </MaxWidthWrapper>
      </div>
    </footer>
  )
}
