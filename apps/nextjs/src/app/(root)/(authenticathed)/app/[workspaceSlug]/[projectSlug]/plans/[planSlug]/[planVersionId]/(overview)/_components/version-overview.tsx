import { Pencil } from "lucide-react"

import type { RouterOutputs } from "@builderai/api"
import { cn } from "@builderai/ui"
import { Button } from "@builderai/ui/button"
import { Card, CardContent, CardFooter } from "@builderai/ui/card"
import { Separator } from "@builderai/ui/separator"

import { PlanVersionDialog } from "../../../_components/plan-version-dialog"

export default function VersionOverview({
  planVersion,
}: {
  planVersion: RouterOutputs["planVersions"]["getById"]["planVersion"]
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col">
        <div className="flex h-[70px] shrink-0 items-center justify-between space-x-1 px-4 py-2">
          <div className="flex items-center space-x-2">
            <h3 className="truncate text-xl font-bold">
              {planVersion.title.toUpperCase()}
            </h3>

            <div
              className={cn("inline-flex items-center text-xs font-semibold", {
                "text-success": planVersion.status === "published",
                "text-info": planVersion.status !== "published",
              })}
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
          <PlanVersionDialog defaultValues={planVersion}>
            <Button size="sm" variant="default">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </PlanVersionDialog>
        </div>
      </div>
      <Separator />
      <CardContent className="p-4 text-sm">
        <div className="grid gap-3">
          <div className="font-semibold">Basic Information</div>
          <dl className="grid gap-3">
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1 text-muted-foreground">
                Currency
              </dt>
              <dd>{planVersion.currency}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1 text-muted-foreground">
                Type
              </dt>
              <dd>{planVersion.planType}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1 text-muted-foreground">
                Billing Period
              </dt>
              <dd>{planVersion.billingPeriod}</dd>
            </div>
          </dl>
        </div>
        <Separator className="my-4" />
        <div className="grid gap-3">
          <div className="font-semibold">Billing Information</div>
          <dl className="grid gap-3">
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1 text-muted-foreground">
                Provider
              </dt>
              <dd>{planVersion.paymentProvider}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1 text-muted-foreground">
                Grace period
              </dt>
              <dd>{planVersion.gracePeriod}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1 text-muted-foreground">
                start Cycle
              </dt>
              <dd>{planVersion.startCycle}</dd>
            </div>
          </dl>
        </div>
      </CardContent>
      <CardFooter className="flex flex-row items-center border-t px-4 py-3">
        <div className="text-xs text-muted-foreground">{planVersion.id}</div>
      </CardFooter>
    </Card>
  )
}
