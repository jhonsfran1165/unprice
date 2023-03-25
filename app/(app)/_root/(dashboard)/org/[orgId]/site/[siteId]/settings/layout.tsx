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
  return <DashboardShell>{children}</DashboardShell>
}
