import { notFound } from "next/navigation"

import { useStore } from "@/lib/stores/layout"
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

  const { data: orgsProfile } = await supabase
    .from("organization_profiles")
    .select("*, organization!inner(slug)")
    .eq("profile_id", session?.user.id)
    .eq("organization.slug", orgSlug)
    .single()

  if (!orgsProfile) {
    notFound()
  }

  return children
}
