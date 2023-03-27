import { DashboardShell } from "@/components/dashboard/shell"

export default async function DashboardLayout({
  children,
  params: { orgId },
}: {
  children: React.ReactNode
  params: {
    orgId: string
  }
}) {
  return <DashboardShell>{children}</DashboardShell>
}
