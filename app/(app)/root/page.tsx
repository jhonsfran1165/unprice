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
  let defaultOrgSlug = ""

  for (var key in appClaims["organizations"]) {
    if (appClaims["organizations"][key]?.is_default)
      defaultOrgSlug = appClaims["organizations"][key].slug
  }

  if (defaultOrgSlug) {
    redirect(`/org/${defaultOrgSlug}`)
  } else {
    redirect(`/org`)
  }
}
