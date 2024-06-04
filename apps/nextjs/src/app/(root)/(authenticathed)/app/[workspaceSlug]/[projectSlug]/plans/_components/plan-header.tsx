import { BadgeCheck } from "lucide-react"

import type { RouterOutputs } from "@builderai/api"
import { cn } from "@builderai/ui"
import { Badge } from "@builderai/ui/badge"
import { Button } from "@builderai/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@builderai/ui/card"
import { Separator } from "@builderai/ui/separator"

import { PlanVersionDialog } from "../[planSlug]/_components/plan-version-dialog"
import { PlanActions } from "./plan-actions"

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
            <CardDescription className="line-clamp-2 h-12 max-w-lg text-balance leading-relaxed">
              {plan.description}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <div className="flex space-x-2">
              <Badge
                className={cn({
                  success: plan.active,
                  danger: !plan.active,
                })}
              >
                <span className="bg-success-solid flex h-2 w-2 rounded-full" />
                <span className="ml-1">{plan.active ? "active" : "inactive"}</span>
              </Badge>

              {plan.defaultPlan && (
                <Badge>
                  <BadgeCheck className="h-3 w-3" />
                  <span className="ml-1">{"default"}</span>
                </Badge>
              )}
            </div>
          </CardFooter>
        </div>

        <div className="flex items-center px-6">
          <div className="button-primary flex items-center space-x-1 rounded-md">
            <div className="sm:col-span-full">
              <PlanVersionDialog
                defaultValues={{
                  planId: plan.id,
                  description: plan.description,
                  title: plan.slug,
                  projectId: plan.projectId,
                  // TODO: use default currency from org settings
                  currency: "USD",
                  planType: "recurring",
                  paymentProvider: "stripe",
                }}
              >
                <Button variant={"custom"}>Add Version</Button>
              </PlanVersionDialog>
            </div>

            <Separator orientation="vertical" className="h-[20px] p-0" />

            <PlanActions plan={plan} />
          </div>
        </div>
      </div>
    </Card>
  )
}
