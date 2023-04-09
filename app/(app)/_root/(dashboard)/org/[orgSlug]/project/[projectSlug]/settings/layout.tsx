import { getDashboardSidebarNavItems } from "@/lib/config/dashboard"
import { DashboardShell } from "@/components/dashboard/shell"

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params
}) {
  return <DashboardShell>{children}</DashboardShell>
}
