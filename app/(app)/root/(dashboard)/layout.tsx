import { AppModules } from "@/lib/config/dashboard"
import { createServerClient } from "@/lib/supabase/supabase-server"
import { OrganizationViewData } from "@/lib/types/supabase"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import HeaderContext from "@/components/layout/header-context"
import StoreHandler from "@/components/layout/store-handler"

export const revalidate = 0

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { data: dataOrgs, error } = await supabase
    .from("data_orgs")
    .select("*, organization!inner(*)")
    .eq("profile_id", session?.user.id)

  return (
    <>
      <StoreHandler
        orgProfiles={dataOrgs as OrganizationViewData[]}
        session={session}
        modulesApp={AppModules}
      />
      {/* @ts-expect-error Server Component */}
      <Header />
      <HeaderContext />
      <main className="flex grow flex-col">{children}</main>
      <Footer />
    </>
  )
}
