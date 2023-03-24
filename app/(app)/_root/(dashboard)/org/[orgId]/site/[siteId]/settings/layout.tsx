import { getDashboardSidebarNavItems } from "@/lib/config/dashboard"
import { DashboardShell } from "@/components/shared/dashboard/shell"

export default async function DashboardLayout({
  children,
  params: { orgId, siteId },
}: {
  children: React.ReactNode
  params: {
    orgId: string
    siteId: string
  }
}) {
  const items = getDashboardSidebarNavItems({
    moduleNav: "site",
    slug: "site-settings",
  })

  return (
    <DashboardShell items={items} prefixPath={`/org/${orgId}/site/${siteId}`}>
      {children}
    </DashboardShell>
  )
}
