import { RefreshCcw } from "lucide-react"

import type { RouterOutputs } from "@builderai/api"
import { cn } from "@builderai/ui"
import { Badge } from "@builderai/ui/badge"
import { Button } from "@builderai/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@builderai/ui/card"

import { PlanVersionDialog } from "../[planSlug]/_components/plan-version-dialog"

export const runtime = "edge"

export default function PlanHeader(props: {
  workspaceSlug: string
  projectSlug: string
  planVersionId: string
  plan: RouterOutputs["plans"]["getBySlug"]["plan"]
  className?: string
}) {
  const { plan } = props
  return (
    <Card>
      <div className="flex flex-row justify-between">
        <div className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle>{plan.slug.toUpperCase()}</CardTitle>
            <CardDescription className="max-w-lg text-balance leading-relaxed">
              {plan.description}
            </CardDescription>
          </CardHeader>
          <CardFooter>
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
              <Badge>
                <RefreshCcw className="h-3 w-3" />
                <span className="ml-1">{plan.type}</span>
              </Badge>
            </div>
          </CardFooter>
        </div>

        <div className="flex items-center px-6">
          <PlanVersionDialog
            defaultValues={{
              planId: plan.id,
              description: plan.description,
              title: plan.slug,
              projectId: plan.projectId,
            }}
          >
            <Button>Create New Version</Button>
          </PlanVersionDialog>
        </div>
      </div>
    </Card>
  )
}
