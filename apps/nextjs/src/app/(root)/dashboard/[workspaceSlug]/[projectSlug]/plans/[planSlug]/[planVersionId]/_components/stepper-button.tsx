"use client"

import { ChevronRight } from "lucide-react"
import { usePathname } from "next/navigation"

import { Button } from "@unprice/ui/button"

import { SuperLink } from "~/components/super-link"
import { PlanVersionPublish } from "../../../_components/plan-version-actions"

export default function StepperButton({
  baseUrl,
  planVersionId,
  isPublished,
}: {
  baseUrl: string
  planVersionId: string
  isPublished?: boolean
}) {
  const step = usePathname().split("/").pop()

  if (step === planVersionId) {
    return (
      <SuperLink href={`${baseUrl}/review`}>
        <Button>
          continue
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </SuperLink>
    )
  }

  if (isPublished) {
    return null
  }

  return <PlanVersionPublish planVersionId={planVersionId} />
}
