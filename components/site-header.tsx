import Link from "next/link"

import { siteConfig } from "@/config/site"
import { fetchCategories } from "@/lib/getCategories"
import { Icons } from "@/components/icons"
import { MainNav } from "@/components/main-nav"
import MaxWidthWrapper from "@/components/shared/max-width-wrapper"
import { TabGroup } from "@/components/shared/tab-group"
import { ThemeToggle } from "@/components/theme-toggle"
import { buttonVariants } from "@/components/ui/button"

export async function SiteHeader() {
  const categories = await fetchCategories()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-b-slate-200">
      <MaxWidthWrapper>
        <div className="flex h-16 items-center space-x-2 sm:justify-between sm:space-x-0">
          <MainNav items={siteConfig.mainNav} />
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-1">
              <Link
                href={siteConfig.links.github}
                target="_blank"
                rel="noreferrer"
              >
                <div
                  className={buttonVariants({
                    size: "sm",
                    variant: "ghost",
                  })}
                >
                  <Icons.gitHub className="h-5 w-5" />
                  <span className="sr-only">GitHub</span>
                </div>
              </Link>
              <Link
                href={siteConfig.links.twitter}
                target="_blank"
                rel="noreferrer"
              >
                <div
                  className={buttonVariants({
                    size: "sm",
                    variant: "ghost",
                  })}
                >
                  <Icons.twitter className="h-5 w-5 fill-current" />
                  <span className="sr-only">Twitter</span>
                </div>
              </Link>
              <ThemeToggle />
            </nav>
          </div>
        </div>
        {/* tabs -> convert only that part to server components? */}
        <div className="-mb-0.5 flex h-12 items-center justify-start space-x-2">
          {categories && (
            <TabGroup
              path="/dashboard"
              items={[
                ...categories.map((x) => ({
                  text: x.name,
                  slug: x.slug,
                })),
              ]}
            />
          )}
        </div>
      </MaxWidthWrapper>
    </header>
  )
}
