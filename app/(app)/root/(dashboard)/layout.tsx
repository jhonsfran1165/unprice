import { AppModules } from "@/lib/config/dashboard"
import { createServerClient } from "@/lib/supabase/supabase-server"
import { AppClaims } from "@/lib/types"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import HeaderContext from "@/components/layout/header-context"
import StoreHandler from "@/components/layout/store-handler"

export const revalidate = 0

export default async function DashboardLayout(props) {
  const supabase = createServerClient()

  // console.log(props.childProp)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const appClaims = session?.user.app_metadata as AppClaims

  return (
    <>
      <StoreHandler
        appClaims={appClaims}
        session={session}
        modulesApp={AppModules}
      />
      {/* @ts-expect-error Server Component */}
      <Header />
      <HeaderContext />
      <main className="flex grow flex-col">{props.children}</main>
      <Footer />
    </>
  )
}
