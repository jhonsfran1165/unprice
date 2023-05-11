import { redirect } from "next/navigation"

import { createServerClient } from "@/lib/supabase/supabase-server"

export const revalidate = 0

export default async function AppInitialPage() {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // would be better to rely on jwt to avoid extra calls to the database but
  // the refresh token issue for jwt is a problem
  const { data: claim } = await supabase.rpc("get_claim", {
    user_id: session?.user.id ?? "",
    claim: "organizations",
  })

  const orgId = Object.keys(claim ?? {}).find(
    (key) => claim && claim[key].is_default === true
  )

  const defaultOrg = claim && orgId ? claim[orgId] : null

  if (defaultOrg) {
    redirect(`/org/${defaultOrg?.slug}`)
  } else {
    redirect(`/org`)
  }
}
