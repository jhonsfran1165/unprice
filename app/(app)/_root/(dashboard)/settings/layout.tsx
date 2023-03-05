import { getDashboardSidebarNavItems } from "@/lib/config/dashboard"
import { DashboardShell } from "@/components/shared/dashboard/shell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const items = getDashboardSidebarNavItems({
    moduleNav: "main",
    slug: "main-settings",
    pathPrefix: "",
  })

  return (
    <DashboardShell items={items} prefixPath={"/"}>
      {children}
    </DashboardShell>
  )
}
