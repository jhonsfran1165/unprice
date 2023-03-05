import { createServerClient } from "@/lib/supabase/supabase-server"
import type { Site } from "@/lib/types/supabase"
import MaxWidthWrapper from "@/components/shared/max-width-wrapper"
import { SitesCard } from "@/components/shared/sites/sites-cards"

// TODO: introduce example framer motion
// https://www.josephcollicoat.com/articles/animating-text-with-the-intersection-observer-api-and-framer-motion

export default async function DashboardIndexPage() {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { data } = await supabase
    .from("site_users")
    .select("site(*)")
    .eq("user_id", session?.user.id)

  const sites = data?.map((d) => d.site) as Site[]

  return (
    <MaxWidthWrapper className="pt-10">
      <SitesCard sites={sites} />
    </MaxWidthWrapper>
  )
}
