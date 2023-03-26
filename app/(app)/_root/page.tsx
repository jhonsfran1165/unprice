import { notFound, redirect } from "next/navigation"

import { createServerClient } from "@/lib/supabase/supabase-server"

export default async function AppInitialPage() {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // TODO: create welcome page or register org
  const { data: orgProfiles } = await supabase
    .from("organization_profiles")
    .select("*, profile(*), organization(*)")
    .eq("profile_id", session?.user.id)

  const defaultOrg = orgProfiles?.find((org) => org.is_default === true)

  if (defaultOrg) {
    redirect(`/org/${defaultOrg?.org_id}`)
  }

  notFound()
}
