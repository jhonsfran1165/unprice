"use client"

import { TabNavigation, TabNavigationLink } from "@unprice/ui/tabs-navigation"
import { useSearchParams } from "next/navigation"
import { SuperLink } from "~/components/super-link"

const TabsDashboard = ({
  baseUrl,
  activeTab,
}: { baseUrl: string; activeTab: "overview" | "plans" | "features" | "pages" }) => {
  // add a query params in the url to avoid wipe the filters
  const params = useSearchParams()
  const allParams = params.toString()

  return (
    <TabNavigation variant="solid">
      <div className="flex items-center">
        <TabNavigationLink active={activeTab === "overview"} asChild>
          <SuperLink href={`${baseUrl}/dashboard${allParams ? `?${allParams}` : ""}`}>
            Overview
          </SuperLink>
        </TabNavigationLink>
        <TabNavigationLink active={activeTab === "plans"} asChild>
          <SuperLink href={`${baseUrl}/dashboard/plans${allParams ? `?${allParams}` : ""}`}>
            Plans
          </SuperLink>
        </TabNavigationLink>
        <TabNavigationLink active={activeTab === "features"} asChild>
          <SuperLink href={`${baseUrl}/dashboard/features${allParams ? `?${allParams}` : ""}`}>
            Features
          </SuperLink>
        </TabNavigationLink>
        <TabNavigationLink active={activeTab === "pages"} asChild>
          <SuperLink href={`${baseUrl}/dashboard/pages${allParams ? `?${allParams}` : ""}`}>
            Pages
          </SuperLink>
        </TabNavigationLink>
      </div>
    </TabNavigation>
  )
}

export default TabsDashboard
