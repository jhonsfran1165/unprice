"use client"

import { Kbd } from "@unprice/ui/kbd"
import { TabNavigation, TabNavigationLink } from "@unprice/ui/tabs-navigation"
import { useRouter, useSearchParams } from "next/navigation"
import { useHotkeys } from "react-hotkeys-hook"
import { SuperLink } from "~/components/super-link"

const tabs = ["overview", "plans", "features", "pages"] as const

const TabsDashboard = ({
  baseUrl,
  activeTab,
}: { baseUrl: string; activeTab: (typeof tabs)[number] }) => {
  // add a query params in the url to avoid wipe the filters
  const params = useSearchParams()
  const allParams = params.toString()
  const router = useRouter()

  // handle hotkeys
  useHotkeys(
    ["1", "2", "3", "4"],
    (_, handler) => {
      const key = handler.keys?.at(0) as string
      if (!key) return

      const tab = tabs[Number(key) - 1]

      if (tab) {
        if (tab === activeTab) return
        if (tab === "overview") {
          router.push(`${baseUrl}/dashboard${allParams ? `?${allParams}` : ""}`, {
            scroll: false,
          })
          return
        }

        router.push(`${baseUrl}/dashboard/${tab}${allParams ? `?${allParams}` : ""}`, {
          scroll: false,
        })
      }
    },
    {
      keydown: false,
      keyup: true, // to avoid someone holding the key down and triggering the hotkey multiple times
    }
  )

  return (
    <TabNavigation variant="solid">
      <div className="flex items-center">
        <TabNavigationLink active={activeTab === "overview"} asChild>
          <SuperLink href={`${baseUrl}/dashboard${allParams ? `?${allParams}` : ""}`}>
            Overview{" "}
            <Kbd abbrTitle="1" className="ml-2">
              1
            </Kbd>
          </SuperLink>
        </TabNavigationLink>
        <TabNavigationLink active={activeTab === "plans"} asChild>
          <SuperLink href={`${baseUrl}/dashboard/plans${allParams ? `?${allParams}` : ""}`}>
            Plans{" "}
            <Kbd abbrTitle="2" className="ml-2">
              2
            </Kbd>
          </SuperLink>
        </TabNavigationLink>
        <TabNavigationLink active={activeTab === "features"} asChild>
          <SuperLink href={`${baseUrl}/dashboard/features${allParams ? `?${allParams}` : ""}`}>
            Features{" "}
            <Kbd abbrTitle="3" className="ml-2">
              3
            </Kbd>
          </SuperLink>
        </TabNavigationLink>
        <TabNavigationLink active={activeTab === "pages"} asChild>
          <SuperLink href={`${baseUrl}/dashboard/pages${allParams ? `?${allParams}` : ""}`}>
            Pages{" "}
            <Kbd abbrTitle="4" className="ml-2">
              4
            </Kbd>
          </SuperLink>
        </TabNavigationLink>
      </div>
    </TabNavigation>
  )
}

export default TabsDashboard
