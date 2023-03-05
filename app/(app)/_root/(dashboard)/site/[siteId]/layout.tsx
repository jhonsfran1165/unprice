import { notFound } from "next/navigation"

import { createServerClient } from "@/lib/supabase/supabase-server"

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: {
    siteId: string
  }
}) {
  const supabase = createServerClient()
  const { data: site } = await supabase
    .from("site")
    .select("*")
    .eq("id", params.siteId)
    .single()

  if (!site) {
    notFound()
  }

  return children
}
