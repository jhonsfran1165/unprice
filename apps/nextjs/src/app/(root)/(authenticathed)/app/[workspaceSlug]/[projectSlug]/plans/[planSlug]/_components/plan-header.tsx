import React from "react"
import Link from "next/link"
import { DollarSign, RefreshCcw } from "lucide-react"

import type { RouterOutputs } from "@builderai/api"
import { cn } from "@builderai/ui"
import { Badge } from "@builderai/ui/badge"
import { ChevronLeft } from "@builderai/ui/icons"

import HeaderTab from "~/components/layout/header-tab"
import MaxWidthWrapper from "~/components/layout/max-width-wrapper"

export const runtime = "edge"

export default function PlanHeader(props: {
  children: React.ReactNode
  workspaceSlug: string
  projectSlug: string
  planVersionId: string
  plan: RouterOutputs["plans"]["getBySlug"]["plan"]
}) {
  const { workspaceSlug, projectSlug, planVersionId, plan } = props
  return (
    <div className="flex flex-col">
      <MaxWidthWrapper className="max-w-screen-2xl">
        <div className="mb-6 flex justify-between align-middle">
          <Link
            className="flex items-center justify-start align-middle text-sm"
            prefetch={false}
            href={`/${workspaceSlug}/${projectSlug}/plans`}
          >
            <Badge variant={"outline"} className="py-1">
              <ChevronLeft className="h-4 w-4" />
              back
            </Badge>
          </Link>
        </div>
      </MaxWidthWrapper>
      <HeaderTab>
        <div className="flex w-full items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-normal text-background-textContrast">
              {`${plan.title}: ${planVersionId === undefined ? "new version" : `version ${planVersionId}`}`}
            </h1>
            <h4 className="text-base text-muted-foreground">
              {plan.description}
            </h4>
            <div className="flex space-x-1">
              <Badge
                className={cn({
                  success: plan.active,
                  danger: !plan.active,
                })}
              >
                <span className="flex h-2 w-2 rounded-full bg-success-solid" />
                <span className="ml-1">
                  {plan.active ? "active" : "inactive"}
                </span>
              </Badge>
              <Badge className="info">
                <DollarSign className="h-3 w-3" />
                <span className="ml-1">{plan.currency}</span>
              </Badge>
              <Badge className="warning">
                <RefreshCcw className="h-3 w-3" />
                <span className="ml-1">{plan.billingPeriod}</span>
              </Badge>
            </div>
          </div>
          <div>{props.children}</div>
        </div>
      </HeaderTab>
    </div>
  )
}
