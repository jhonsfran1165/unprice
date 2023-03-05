import { getDashboardSidebarNavItems } from "@/lib/config/dashboard"
import { DashboardShell } from "@/components/shared/dashboard/shell"

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: {
    siteId: string
  }
}) {
  const items = getDashboardSidebarNavItems({
    moduleNav: "site",
    slug: "sites-settings",
    pathPrefix: `/site/${params.siteId}`,
  })

  return (
    <DashboardShell items={items} prefixPath={`/site/${params.siteId}`}>
      {children}
    </DashboardShell>
  )
}
