"use client"

import { Card } from "@/components/shared/card"
import MaxWidthWrapper from "@/components/shared/max-width-wrapper"

// TODO: introduce example framer motion
// https://www.josephcollicoat.com/articles/animating-text-with-the-intersection-observer-api-and-framer-motion

export default function OrgSettingsIndexPage() {
  return (
    <MaxWidthWrapper className="md:px-0 border-error">
      <Card className="h-36"></Card>
      <Card className="my-10 h-36">jhoan</Card>
      <Card className="mb-10 h-36">jhoan</Card>
    </MaxWidthWrapper>
  )
}
