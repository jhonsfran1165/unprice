import { Pencil } from "lucide-react"

import type { RouterOutputs } from "@builderai/api"
import { Button } from "@builderai/ui/button"
import { Card, CardContent, CardFooter } from "@builderai/ui/card"
import { Separator } from "@builderai/ui/separator"
import { cn } from "@builderai/ui/utils"

import { PlanVersionDialog } from "../../_components/plan-version-dialog"
import { BannerPublishedVersion } from "./banner"

export default function VersionOverview({
  planVersion,
}: {
  planVersion: RouterOutputs["planVersions"]["getById"]["planVersion"]
}) {
  return (
    <div className="flex flex-col gap-4">
      <Card className="bg-background-base border-none">
        <div className="flex flex-col">
          <div className="flex h-[70px] shrink-0 items-center justify-between space-x-1 px-0 py-2">
            <div className="flex items-center space-x-2">
              <h3 className="truncate text-xl font-bold">{planVersion.title.toUpperCase()}</h3>

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
        <CardContent className="px-0 py-4 text-sm">
          <div className="grid gap-3">
            <div className="font-semibold">Basic Information</div>
            <dl className="grid gap-3">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground flex items-center gap-1">Currency</dt>
                <dd>{planVersion.currency}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground flex items-center gap-1">Type</dt>
                <dd>{planVersion.planType}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground flex items-center gap-1">Billing Period</dt>
                <dd>{planVersion.billingPeriod}</dd>
              </div>
            </dl>
          </div>
          <Separator className="my-4" />
          <div className="grid gap-3">
            <div className="font-semibold">Billing Information</div>
            <dl className="grid gap-3">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground flex items-center gap-1">Provider</dt>
                <dd>{planVersion.paymentProvider}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground flex items-center gap-1">Grace period</dt>
                <dd>{planVersion.gracePeriod}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground flex items-center gap-1">start Cycle</dt>
                <dd>{planVersion.startCycle}</dd>
              </div>
            </dl>
          </div>
        </CardContent>
        <CardFooter className="flex flex-row items-center border-t px-0 py-4">
          <div className="text-muted-foreground text-xs">{planVersion.id}</div>
        </CardFooter>
      </Card>
      {planVersion.status === "published" && <BannerPublishedVersion />}
    </div>
  )
}
