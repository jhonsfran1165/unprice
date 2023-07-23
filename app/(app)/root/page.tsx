import { redirect } from "next/navigation"

import { createServerClient } from "@/lib/supabase/supabase-server"
import { AppClaims } from "@/lib/types"
import { getOrgsFromClaims } from "@/lib/utils"

export const revalidate = 0

export default async function AppInitialPage() {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  const appClaims = session?.user.app_metadata as AppClaims
  const { currentOrg, defaultOrgSlug } = getOrgsFromClaims({ appClaims })

  if (currentOrg?.slug) {
    redirect(`/org/${currentOrg?.slug}`)
  }

  if (defaultOrgSlug) {
    redirect(`/org/${defaultOrgSlug}`)
  } else {
    redirect(`/org`)
  }
}
