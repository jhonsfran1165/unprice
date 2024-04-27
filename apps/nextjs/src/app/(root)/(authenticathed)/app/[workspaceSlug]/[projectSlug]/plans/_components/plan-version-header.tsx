import Link from "next/link"
import { RefreshCcw } from "lucide-react"

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

import CreateNewVersion from "./create-new-version"

export const runtime = "edge"

export default function PlanVersionHeader(props: {
  workspaceSlug: string
  projectSlug: string
  planVersionId: string
  planVersion: RouterOutputs["plans"]["getVersionById"]["planVersion"]
}) {
  const { workspaceSlug, projectSlug, planVersionId, planVersion } = props
  return (
    <div className="flex flex-col">
      <div className="my-4 flex justify-between align-middle">
        <Link
          className="flex items-center justify-start align-middle text-sm"
          prefetch={false}
          href={`/${workspaceSlug}/${projectSlug}/plans/${planVersion.plan.slug}`}
        >
          <Badge variant={"outline"} className="bg-background-bgSubtle py-1">
            <ChevronLeft className="h-4 w-4" />
            back to versions
          </Badge>
        </Link>
      </div>
      <Card className="sm:col-span-2">
        <div className="flex flex-row justify-between">
          <div className="flex flex-col">
            <CardHeader className="pb-3">
              {/* // TODO: add edit button here */}
              <CardTitle>{planVersion.title}</CardTitle>
              <CardDescription className="max-w-lg text-balance leading-relaxed">
                small descriptions
              </CardDescription>
              <ul className="grid gap-1 p-1">
                <li className="flex items-center justify-between text-xs ">
                  <span className="text-xs text-muted-foreground">
                    plan slug: <span>{planVersion.plan.slug}</span>
                  </span>
                </li>
                <li className="flex items-center justify-between text-xs ">
                  <span className="text-xs text-muted-foreground">
                    grace Period: <span>{planVersion.gracePeriod}</span>
                  </span>
                </li>
                <li className="flex items-center justify-between text-xs ">
                  <span className="text-muted-foreground">
                    startCycle: <span>{planVersion.startCycle}</span>
                  </span>
                </li>
              </ul>
            </CardHeader>

            <CardFooter>
              <div className="flex space-x-1">
                <Badge
                  className={cn({
                    success: planVersion.status === "published",
                    danger: planVersion.status === "archived",
                  })}
                >
                  <span className="flex h-2 w-2 rounded-full bg-success-solid" />
                  <span className="ml-1">{planVersion.status}</span>
                </Badge>
                <Badge variant={"secondary"}>
                  <RefreshCcw className="h-3 w-3" />
                  <span className="ml-1">{planVersion.currency}</span>
                </Badge>
                <Badge variant={"secondary"}>
                  <RefreshCcw className="h-3 w-3" />
                  <span className="ml-1">montly</span>
                </Badge>
                <Badge variant={"secondary"}>
                  <RefreshCcw className="h-3 w-3" />
                  <span className="ml-1">montly</span>
                </Badge>
              </div>
            </CardFooter>
          </div>

          <div className="flex items-center px-6">
            <CreateNewVersion
              plan={planVersion.plan}
              projectSlug={projectSlug}
              workspaceSlug={workspaceSlug}
              planVersionId={Number(planVersionId)}
            />
          </div>
        </div>
      </Card>
    </div>
  )
}
