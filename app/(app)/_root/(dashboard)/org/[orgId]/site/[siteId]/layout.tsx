import { notFound } from "next/navigation"

import { useStore } from "@/lib/stores/layout"
import { createServerClient } from "@/lib/supabase/supabase-server"

export const revalidate = 0

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: {
    siteId: string
    orgId: string
  }
}) {
  const supabase = createServerClient()

  const { data: site } = await supabase
    .from("site")
    .select("*")
    .eq("id", params.siteId)
    .eq("org_id", params.orgId)
    .single()

  if (!site) {
    notFound()
  }

  return children
}
