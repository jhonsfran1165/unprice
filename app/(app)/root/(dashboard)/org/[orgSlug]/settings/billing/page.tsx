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
  // -----------------------------------------------
  // TODO: convert this in a function? - it is used on lots of things
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
  // TODO: handle if there is no organization with that slug
  // -----------------------------------------------

  const { data: projects, error } = await supabase
    .from("project")
    .select("*")
    .eq("org_id", orgId)

  // TODO: handle error

  return <BillingProjects projects={projects || []} />
}
