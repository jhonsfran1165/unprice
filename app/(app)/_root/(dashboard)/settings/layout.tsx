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
}: {
  children: React.ReactNode
}) {
  const items = dashboardConfig.mainNav.find(
    (item) => item.href === "/settings"
  )

  return (
    <DashboardShell items={items?.sidebarNav} prefixPath={"/"}>
      {children}
    </DashboardShell>
  )
}
