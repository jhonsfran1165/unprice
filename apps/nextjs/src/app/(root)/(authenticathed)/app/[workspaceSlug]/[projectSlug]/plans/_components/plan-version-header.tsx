import Link from "next/link"
import { DollarSign, GalleryHorizontalEnd, RefreshCcw } from "lucide-react"

import type { RouterOutputs } from "@builderai/api"
import { cn } from "@builderai/ui"
import { Badge } from "@builderai/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@builderai/ui/card"
import { ChevronLeft } from "@builderai/ui/icons"

import PlanVersionActions from "./plan-version-actions"

export const runtime = "edge"

export default function PlanVersionHeader(props: {
  workspaceSlug: string
  projectSlug: string
  planVersion: RouterOutputs["planVersions"]["getByVersion"]["planVersion"]
}) {
  const { workspaceSlug, projectSlug, planVersion } = props
  return (
    <div className="flex flex-col">
      <div className="mb-4 flex justify-between align-middle">
        <Link
          className="flex items-center justify-start align-middle text-sm"
          prefetch={false}
          href={`/${workspaceSlug}/${projectSlug}/plans/${planVersion.plan.slug}`}
        >
          <Badge variant={"outline"} className="bg-background-bgSubtle py-1">
            <ChevronLeft className="h-4 w-4" />
            back
          </Badge>
        </Link>
      </div>
      <Card className="sm:col-span-2">
        <div className="flex flex-row justify-between">
          <div className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-4">
                <CardTitle>{planVersion.title}</CardTitle>

                <div
                  className={cn(
                    "inline-flex items-center text-xs font-semibold",
                    {
                      "text-success": planVersion.status === "published",
                      "text-info": planVersion.status !== "published",
                    }
                  )}
                >
                  <span
                    className={cn("flex h-2 w-2 rounded-full", {
                      "bg-success-solid": planVersion.status === "published",
                      "bg-info": planVersion.status !== "published",
                    })}
                  />
                  <span className="ml-1">{planVersion.status}</span>
                </div>
              </div>

              <CardDescription className="line-clamp-1 h-12 max-w-lg text-balance leading-relaxed">
                {planVersion.description}
              </CardDescription>
            </CardHeader>

            <CardFooter>
              <div className="flex space-x-1">
                {planVersion.latest && (
                  <Badge
                    className={cn({
                      success: planVersion.latest,
                    })}
                  >
                    <GalleryHorizontalEnd className="h-3 w-3" />
                    <span className="ml-1">latest</span>
                  </Badge>
                )}

                <Badge>
                  <DollarSign className="h-3 w-3" />
                  <span className="ml-1">{planVersion.currency}</span>
                </Badge>

                <Badge>
                  <RefreshCcw className="h-3 w-3" />
                  <span className="ml-1">{planVersion.billingPeriod}</span>
                </Badge>

                {planVersion.tags?.map((tag, i) => (
                  <Badge key={i}>
                    <span>{tag}</span>
                  </Badge>
                ))}
              </div>
            </CardFooter>
          </div>

          <div className="flex items-center px-6">
            <PlanVersionActions planVersion={planVersion} />
          </div>
        </div>
      </Card>
    </div>
  )
}
