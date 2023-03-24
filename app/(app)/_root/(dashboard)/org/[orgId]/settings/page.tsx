"use client"

import { useStore } from "@/lib/stores/layout"
import { Boundary } from "@/components/shared/boundary"
import { Card } from "@/components/shared/card"
import MaxWidthWrapper from "@/components/shared/max-width-wrapper"
import { SitesContainer } from "@/components/shared/sites/sites-container"

// TODO: introduce example framer motion
// https://www.josephcollicoat.com/articles/animating-text-with-the-intersection-observer-api-and-framer-motion

export default function IndexPage() {
  return (
    <MaxWidthWrapper className="md:px-0 border-error">
      <Card className="h-36"></Card>
      <Card className="my-10 h-36">jhoan</Card>
      <Card className="mb-10 h-36">jhoan</Card>
    </MaxWidthWrapper>
  )
}
