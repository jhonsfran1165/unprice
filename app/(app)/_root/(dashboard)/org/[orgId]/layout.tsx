import { notFound } from "next/navigation"

import { useStore } from "@/lib/stores/layout"
import { createServerClient } from "@/lib/supabase/supabase-server"

export const revalidate = 0

export default async function DashboardLayout({
  children,
  params: { orgId },
}: {
  children: React.ReactNode
  params: {
    orgId: string
  }
}) {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { data } = await supabase
    .from("organization_profiles")
    .select("*, organization(*)")
    .eq("profile_id", session?.user.id)

  const orgIdsProfile = data?.map((org) => org.org_id)

  // TODO: add permissions problems here
  if (!orgIdsProfile?.includes(parseInt(orgId))) notFound()

  const { data: organization } = await supabase
    .from("organization")
    .select("*")
    .eq("id", orgId)
    .single()

  if (!organization) {
    notFound()
  }

  return children
}
