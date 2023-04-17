import { notFound } from "next/navigation"

import { createServerClient } from "@/lib/supabase/supabase-server"

export const revalidate = 0

export default async function DashboardLayout({
  children,
  params: { orgSlug },
}: {
  children: React.ReactNode
  params: {
    orgSlug: string
  }
}) {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { data: dataOrg } = await supabase
    .from("data_orgs")
    .select("*")
    .eq("profile_id", session?.user.id)
    .eq("org_slug", orgSlug)
    .single()

  if (!dataOrg) {
    notFound()
  }

  return children
}
