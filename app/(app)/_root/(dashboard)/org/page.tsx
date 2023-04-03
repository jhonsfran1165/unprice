import { notFound, redirect } from "next/navigation"

import { createServerClient } from "@/lib/supabase/supabase-server"
import { Organization } from "@/lib/types/supabase"
import { OrganizationForm } from "@/components/organizations/organization-form"

// do not cache this layout because it validates the session constantly
export const revalidate = 0

// TODO: pass search params to make diferrent actions
export default async function AppInitialPage() {
  return <OrganizationForm />
}
