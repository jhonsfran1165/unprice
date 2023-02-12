import "server-only"
import { createServerClient } from "@/lib/supabase/supabase-server"
import MaxWidthWrapper from "@/components/shared/max-width-wrapper"
import { SiteHeader } from "@/components/site-header"
import Test from "./react-query-test"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerClient()
  const { data } = await supabase.from("organization").select("*")
  return (
    <>
      {/* @ts-expect-error Server Component */}
      <SiteHeader />
      <section>
        <div className="flex h-36 items-center border-b border-gray-200 bg-white">
          <MaxWidthWrapper>
            <div className="flex items-center justify-between">
              <h1 className="text-2xl text-gray-600">Projects</h1>
            </div>
          </MaxWidthWrapper>
        </div>

        <Test data={data} />
        {children}
      </section>
    </>
  )
}
