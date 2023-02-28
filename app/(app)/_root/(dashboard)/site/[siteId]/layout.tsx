import {
  dashboardConfig,
  navBarBySlug,
  navBarSiteBySlug,
} from "@/config/dashboard"
import { DashboardShell } from "@/components/shared/dashboard/shell"
import SiteContext from "@/components/shared/layout/site-context"
import { SiteFooter } from "@/components/shared/layout/site-footer"
import { SiteHeader } from "@/components/shared/layout/site-header"

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: any
}) {
  const items = dashboardConfig.mainNavSites.find((item) => item.href === "/")

  return (
    <DashboardShell items={items?.sidebarNav} prefixPath={"/site"}>
      {children}
    </DashboardShell>
  )
}
