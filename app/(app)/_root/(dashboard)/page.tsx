import MaxWidthWrapper from "@/components/shared/max-width-wrapper"
import { SitesContainer } from "@/components/shared/sites/sites-container"

// TODO: introduce example framer motion
// https://www.josephcollicoat.com/articles/animating-text-with-the-intersection-observer-api-and-framer-motion

export default async function DashboardIndexPage() {
  return (
    <MaxWidthWrapper className="pt-10">
      <SitesContainer />
    </MaxWidthWrapper>
  )
}
