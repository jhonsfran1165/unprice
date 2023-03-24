import { getDashboardSidebarNavItems } from "@/lib/config/dashboard"
import { DashboardShell } from "@/components/shared/dashboard/shell"

export default async function DashboardLayout({
  children,
  params: { orgId },
}: {
  children: React.ReactNode
  params: {
    orgId: string
  }
}) {
  const items = getDashboardSidebarNavItems({
    moduleNav: "org",
    slug: "org-settings",
  })

  return (
    <DashboardShell items={items} prefixPath={`/org/${orgId}`}>
      {children}
    </DashboardShell>
  )
}
