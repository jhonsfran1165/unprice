import { ArrowUp, Wallet } from "lucide-react"

import { Card, CardContent, CardFooter } from "@builderai/ui/card"
import { Separator } from "@builderai/ui/separator"

import { PlanVersionConfigurator } from "../../_components/plan-version-configurator"
import DragDrop from "../../../_components/drag-drop"

export default function OverviewVersionPage({
  params,
}: {
  params: {
    planSlug: string
    planVersionId: string
  }
}) {
  const { planSlug, planVersionId } = params

  return (
    <div className="grid flex-1 items-start gap-4 sm:py-0 md:gap-6 lg:grid-cols-3 xl:grid-cols-3">
      <div className="grid auto-rows-max items-start gap-4 md:gap-6 lg:col-span-2">
        {/* // TODO: pass this to a card */}
        <div className="overflow-hidden rounded-[0.5rem] border bg-background">
          <DragDrop>
            <PlanVersionConfigurator
              planSlug={planSlug}
              planVersionId={planVersionId}
            />
          </DragDrop>
        </div>
      </div>
      <div>
        <Card className="overflow-hidden">
          <div className="flex h-full flex-col">
            <div className="flex h-[52px] shrink-0 items-center justify-between space-x-1 px-4 py-2">
              <h1 className="truncate text-xl font-bold">Overview</h1>
            </div>
          </div>
          <Separator />
          <CardContent className="p-4 text-sm">
            <div className="grid gap-3">
              <div className="font-semibold">Revenue</div>
              <dl className="grid gap-3">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Total revenue</dt>
                  <dd>$ 10.456</dd>
                </div>
              </dl>
            </div>
            <Separator className="my-4" />
            <div className="grid gap-3">
              <div className="font-semibold">Subscriptions Details</div>
              <ul className="grid gap-3 font-light">
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Active Subscriptions
                  </span>
                  <span>49</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Inactive Subscriptions
                  </span>
                  <span>11</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Churn Subscriptions
                  </span>
                  <span className="flex flex-row">
                    +3.5% <ArrowUp className="ml-2 h-4 w-4" />
                  </span>
                </li>
              </ul>
            </div>
            <Separator className="my-4" />
            <div className="grid gap-3">
              <div className="font-semibold">Versions</div>
              <dl className="grid gap-3">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Best version</dt>
                  <dd>version 1</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Worse version</dt>
                  <dd>version 2</dd>
                </div>
              </dl>
            </div>
            <Separator className="my-4" />
            <div className="grid gap-3">
              <div className="font-semibold">Payment Information</div>
              <dl className="grid gap-3">
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-1 text-muted-foreground">
                    <Wallet className="h-4 w-4" />
                    Provider
                  </dt>
                  <dd>stripe</dd>
                </div>
              </dl>
            </div>
          </CardContent>
          <CardFooter className="flex flex-row items-center border-t px-6 py-3">
            <div className="text-xs text-muted-foreground">
              Updated{" "}
              <time dateTime="2023-11-23">10:45am, November 23, 2023</time>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
