import "server-only"
import { createServerClient } from "@/lib/supabase/supabase-server"
import SupabaseListener from "@/components/auth//supabase-listener"
import SupabaseProvider from "@/components/auth/supabase-provider"

// do not cache this layout because it validates the session
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

  return (
    <SupabaseProvider>
      <SupabaseListener serverAccessToken={session?.access_token} />
      {children}
    </SupabaseProvider>
  )
}
// TODO: more info here https://supabase.com/docs/guides/auth/auth-helpers/nextjs-server-components#install-the-nextjs-helper-library
// https://github.com/supabase/auth-helpers/tree/main/examples/nextjs-server-components
