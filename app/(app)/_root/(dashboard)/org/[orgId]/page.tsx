import { createServerClient } from "@/lib/supabase/supabase-server"
import { Site } from "@/lib/types/supabase"
import { SitesContainer } from "@/components/shared/sites/sites-container"

// TODO: introduce example framer motion
// https://www.josephcollicoat.com/articles/animating-text-with-the-intersection-observer-api-and-framer-motion

export default async function OrgIndexPage({
  params: { orgId },
}: {
  params: {
    orgId: string
  }
}) {
  const supabase = createServerClient()

  // TODO: revalidate everytime a new site is created
  // https://beta.nextjs.org/docs/data-fetching/mutating
  const { data: sites } = await supabase
    .from("site")
    .select("*")
    .eq("org_id", orgId)

  return <SitesContainer sites={sites as Site[]} />
}
