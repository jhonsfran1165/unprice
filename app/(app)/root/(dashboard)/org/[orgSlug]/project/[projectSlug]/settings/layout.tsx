import { getDashboardSidebarNavItems } from "@/lib/config/dashboard"
import { DashboardShell } from "@/components/layout/shell"

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params
}) {
  return <DashboardShell>{children}</DashboardShell>
}
