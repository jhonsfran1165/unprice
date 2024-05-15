"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"

import { Button } from "@builderai/ui/button"

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
      <Link href={`${baseUrl}/addons`} prefetch={false}>
        <Button>
          continue
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </Link>
    )
  }

  if (step === "addons") {
    return (
      <Link href={`${baseUrl}/review`} prefetch={false}>
        <Button>
          continue
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </Link>
    )
  }

  return <PlanVersionPublish planVersionId={planVersionId} />
}
