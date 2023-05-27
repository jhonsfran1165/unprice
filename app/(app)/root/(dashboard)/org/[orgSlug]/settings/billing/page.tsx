// import { Suspense } from "react"

import { createServerClient } from "@/lib/supabase/supabase-server"
import { AppClaims } from "@/lib/types"
import { BillingProjects } from "@/components/organizations/billing-projects"

export default async function IndexPage({
  params: { orgSlug },
}: {
  params: {
    orgSlug: string
  }
}) {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const appClaims = session?.user.app_metadata as AppClaims
  const orgClaims = appClaims?.organizations
  let orgId = ""

  for (const key in orgClaims) {
    if (Object.prototype.hasOwnProperty.call(orgClaims, key)) {
      if (orgClaims[key].slug === orgSlug) {
        orgId = key
      }
    }
  }

  const { data: projects, error } = await supabase
    .from("project")
    .select("*")
    .eq("org_id", orgId)

  return (
    // <Suspense fallback={"testingsssssss"}>
    <BillingProjects projects={projects || []} />
    // </Suspense>
  )
}
