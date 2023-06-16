import { redirect } from "next/navigation"

import { createServerClient } from "@/lib/supabase/supabase-server"
import { AppClaims } from "@/lib/types"

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
  const orgClaims = appClaims?.organizations
  const currentOrg = appClaims?.current_org

  if (currentOrg?.org_slug) {
    redirect(`/org/${currentOrg.org_slug}`)
  }

  let defaultOrgSlug = ""

  for (const key in orgClaims) {
    if (Object.prototype.hasOwnProperty.call(orgClaims, key)) {
      const org = orgClaims[key]

      if (org.is_default) {
        defaultOrgSlug = org.slug
      }
    }
  }

  if (defaultOrgSlug) {
    redirect(`/org/${defaultOrgSlug}`)
  } else {
    redirect(`/org`)
  }
}
