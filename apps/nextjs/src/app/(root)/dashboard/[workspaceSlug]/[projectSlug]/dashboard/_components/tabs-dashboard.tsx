"use client"

import { TabNavigation, TabNavigationLink } from "@unprice/ui/tabs-navigation"
import { SuperLink } from "~/components/super-link"

const TabsDashboard = ({
  baseUrl,
  activeTab,
}: { baseUrl: string; activeTab: "overview" | "plans" | "features" | "pages" }) => {
  return (
    <TabNavigation variant="solid">
      <div className="flex items-center">
        <TabNavigationLink active={activeTab === "overview"} asChild>
          <SuperLink href={`${baseUrl}/dashboard`}>Overview</SuperLink>
        </TabNavigationLink>
        <TabNavigationLink active={activeTab === "plans"} asChild>
          <SuperLink href={`${baseUrl}/dashboard/plans`}>Plans</SuperLink>
        </TabNavigationLink>
        <TabNavigationLink active={activeTab === "features"} asChild>
          <SuperLink href={`${baseUrl}/dashboard/features`}>Features</SuperLink>
        </TabNavigationLink>
        <TabNavigationLink active={activeTab === "pages"} asChild>
          <SuperLink href={`${baseUrl}/dashboard/pages`}>Pages</SuperLink>
        </TabNavigationLink>
      </div>
    </TabNavigation>
  )
}

export default TabsDashboard
