import { Fragment } from "react"
import type { DashboardRoute, Shortcut } from "~/types"
import { Logo } from "../layout/logo"
import { ShortLink, Tab } from "../layout/tab"
import MobileSidebar from "./mobile-sidebar"
import { UserProfileDesktop, UserProfileMobile } from "./user-nav"

export function Sidebar({
  shortcuts,
  routes,
  baseUrl,
}: {
  shortcuts: Shortcut[]
  routes: DashboardRoute[]
  baseUrl: string
}) {
  return (
    <Fragment>
      {/* sidebar (lg+) */}
      <nav className="hidden sticky top-0 z-40 h-full max-h-screen gap-2 lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col xl:w-72">
        <aside className="flex grow flex-col gap-y-6 overflow-y-auto border-r p-4">
          <Logo />
          <nav aria-label="core navigation links" className="flex flex-1 flex-col space-y-10">
            <ul className="space-y-1">
              {routes.map((item) => (
                <li key={item.name}>
                  <Tab href={baseUrl + item.href} disabled={item.disabled} isNew={item.isNew}>
                    <item.icon className="size-4 shrink-0" aria-hidden="true" />
                    {item.name}
                  </Tab>

                  {
                    item?.sidebar && (
                      <ul className="space-y-0.5 pl-5">
                        {item.sidebar.map((subItem) => (
                          <li key={subItem.name}>
                            <Tab
                              href={baseUrl + subItem.href}
                            >
                              {subItem.icon && (<subItem.icon className="size-3 shrink-0" aria-hidden="true" />)}
                              {subItem.name}
                            </Tab>
                          </li>
                        ))}
                      </ul>
                    )
                  }
                </li>
              ))}
            </ul>
            <div>
              <span className="text-xs font-medium leading-6 text-gray-500">Shortcuts</span>
              <ul aria-label="shortcuts" className="space-y-0.5">
                {shortcuts.map((item) => (
                  <li key={baseUrl + item.name}>
                    <ShortLink href={item.href}>
                      <item.icon className="size-3 shrink-0" aria-hidden="true" />
                      {item.name}
                    </ShortLink>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
          <div className="mt-auto">
            <UserProfileDesktop />
          </div>
        </aside>
      </nav>
      {/* top navbar (xs-lg) */}
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b px-2 shadow-sm sm:gap-x-6 sm:px-4 lg:hidden">
        <Logo />
        <div className="flex items-center gap-1 sm:gap-2">
          <UserProfileMobile />
          <MobileSidebar />
        </div>
      </div>
    </Fragment>
  )
}
