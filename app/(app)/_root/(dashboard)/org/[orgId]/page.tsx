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
  return <SitesContainer />
}
