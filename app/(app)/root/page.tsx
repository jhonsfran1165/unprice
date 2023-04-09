import { notFound, redirect } from "next/navigation"

import { createServerClient } from "@/lib/supabase/supabase-server"
import { Organization } from "@/lib/types/supabase"

// do not cache this layout because it validates the session constantly
export const revalidate = 0

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
    ?.organization as Organization

  if (defaultOrg) {
    redirect(`/org/${defaultOrg?.slug}`)
  } else {
    redirect(`/org`)
  }

  notFound()
}
