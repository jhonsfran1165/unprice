"use client"

import { ChevronRight } from "lucide-react"
import { usePathname } from "next/navigation"

import { Button } from "@unprice/ui/button"

import { SuperLink } from "~/components/super-link"
import { PlanVersionPublish } from "../../../_components/plan-version-actions"

// TODO: if the version is already published, publish button should be disabled
export default function StepperButton({
  baseUrl,
  planVersionId,
}: {
  baseUrl: string
  planVersionId: string
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

  return <PlanVersionPublish planVersionId={planVersionId} />
}
