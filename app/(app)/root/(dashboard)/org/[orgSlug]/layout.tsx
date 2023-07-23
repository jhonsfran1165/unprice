import { notFound } from "next/navigation"

import { createServerClient } from "@/lib/supabase/supabase-server"
import { AppClaims } from "@/lib/types"

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

  const appClaims = session?.user.app_metadata as AppClaims
  const orgClaims = appClaims?.organizations
  let orgExist = false

  for (const key in orgClaims) {
    if (Object.prototype.hasOwnProperty.call(orgClaims, key)) {
      if (orgClaims[key].slug === orgSlug) {
        orgExist = true
      }
    }
  }

  if (!orgExist) {
    notFound()
  }

  return children
}
