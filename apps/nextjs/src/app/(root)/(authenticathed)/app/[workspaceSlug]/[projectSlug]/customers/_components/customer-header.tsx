import type { RouterOutputs } from "@builderai/api"
import { cn } from "@builderai/ui"
import { Badge } from "@builderai/ui/badge"
import { Button } from "@builderai/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@builderai/ui/card"
import { Separator } from "@builderai/ui/separator"

import { SubscriptionSheet } from "../../subscriptions/_components/subscription-sheet"
import { CustomerActions } from "./customer-actions"

export const runtime = "edge"

export default function CustomerHeader(props: {
  workspaceSlug: string
  projectSlug: string
  customer: RouterOutputs["customers"]["getById"]["customer"]
  className?: string
}) {
  const { customer } = props
  return (
    <Card>
      <div className="flex flex-row justify-between">
        <div className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle>{customer.name}</CardTitle>
            <CardDescription className="line-clamp-2 max-w-lg text-balance leading-relaxed">
              {customer.email}
            </CardDescription>

            <CardDescription className="text-normal line-clamp-2 max-w-lg text-balance leading-relaxed">
              {customer.description}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <div className="flex space-x-2">
              <Badge
                className={cn({
                  success: customer.active,
                  danger: !customer.active,
                })}
              >
                <span className="bg-success-solid flex h-2 w-2 rounded-full" />
                <span className="ml-1">{customer.active ? "active" : "inactive"}</span>
              </Badge>
            </div>
          </CardFooter>
        </div>

        <div className="flex items-center px-6">
          <div className="button-primary flex items-center space-x-1 rounded-md">
            <div className="sm:col-span-full">
              <SubscriptionSheet
                defaultValues={{
                  customerId: customer.id,
                  projectId: customer.projectId,
                  planVersionId: "",
                  type: "plan",
                  collectionMethod: "charge_automatically",
                  autoRenew: true,
                  items: [],
                  paymentProviderId: "stripe",
                  startDate: new Date(),
                }}
              >
                <Button variant={"custom"}>Add Subscription</Button>
              </SubscriptionSheet>
            </div>

            <Separator orientation="vertical" className="h-[20px] p-0" />

            <CustomerActions customer={customer} />
          </div>
        </div>
      </div>
    </Card>
  )
}