import { createServerClient } from "@/lib/supabase/supabase-server"
import { AppClaims } from "@/lib/types"
import { getOrgsFromClaims } from "@/lib/utils"
import SupabaseListener from "@/components/auth//supabase-listener"
import SupabaseProvider from "@/components/auth/supabase-provider"

import "server-only"

// do not cache this layout because it validates the session constantly
export const revalidate = 0

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const appClaims = session?.user.app_metadata as AppClaims

  const renderSupabaseListener = () => {
    if (!appClaims) return null

    const { allOrgIds } = getOrgsFromClaims({ appClaims })
    return (
      <SupabaseListener
        serverAccessToken={session?.access_token}
        orgIdsUser={allOrgIds}
        profileId={session?.user.id}
      />
    )
  }

  // for now we use zustag for state management but not sure if we can use something like https://jotai.org/ or recoil for the page builder
  return (
    <SupabaseProvider session={session}>
      {renderSupabaseListener()}
      {children}
    </SupabaseProvider>
  )
}
