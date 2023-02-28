import { DashboardShell } from "@/components/shared/dashboard/shell"
import SiteContext from "@/components/shared/layout/site-context"
import { SiteFooter } from "@/components/shared/layout/site-footer"
import { SiteHeader } from "@/components/shared/layout/site-header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* @ts-expect-error Server Component */}
      <SiteHeader />
      {/* TODO: rename as dashboard header */}
      <SiteContext />
      {children}
      <SiteFooter />
    </>
  )
}
