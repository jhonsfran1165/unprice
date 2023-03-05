import "server-only"
import { createServerClient } from "@/lib/supabase/supabase-server"
import { Footer } from "@/components/shared/layout/footer"
import { Header } from "@/components/shared/layout/header"
import HeaderContext from "@/components/shared/layout/header-context"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  return (
    <>
      {/* @ts-expect-error Server Component */}
      <Header session={session} />
      <HeaderContext />
      {children}
      <Footer />
    </>
  )
}
