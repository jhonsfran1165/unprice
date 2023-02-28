import { siteConfig } from "@/config/site"
import { Icons } from "@/components/shared/icons"
import MaxWidthWrapper from "@/components/shared/max-width-wrapper"

export function SiteFooter() {
  return (
    <footer>
      <div className="fixed min-w-full bottom-0 flex flex-col items-center justify-between gap-4 border-t border-base-skin-200 bg-base-skin py-4 z-30 mt-10 md:h-16 md:flex-row md:py-0">
        <MaxWidthWrapper className="max-w-screen-2xl">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <Icons.logo className="hidden md:block h-6 w-6" />
            <p className="text-center text-sm leading-loose md:text-left">
              Builder AI
            </p>
          </div>
        </MaxWidthWrapper>
      </div>
    </footer>
  )
}
