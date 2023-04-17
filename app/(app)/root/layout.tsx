import "server-only"
import { createServerClient } from "@/lib/supabase/supabase-server"
import SupabaseListener from "@/components/auth//supabase-listener"
import SupabaseProvider from "@/components/auth/supabase-provider"

// do not cache this layout because it validates the session constantly
export const revalidate = 0

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // for now we use zustag for state management but not sure if we can use something like https://jotai.org/ or recoil for the page builder
  return (
    <SupabaseProvider session={session}>
      <SupabaseListener serverAccessToken={session?.access_token} />
      {children}
    </SupabaseProvider>
  )
}
