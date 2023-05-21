"use client"

import { Package } from "lucide-react"

import { pricingSubscriptions } from "@/lib/config/subscriptions"
import { useStore } from "@/lib/stores/layout"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { PricingDialog } from "@/components/subscriptions/pricing-dialog"

export default function IndexPage({
  params: { orgSlug, projectSlug },
  searchParams: { action },
}: {
  params: {
    orgSlug: string
    projectSlug: string
  }
  searchParams: {
    action: string
  }
}) {
  const { orgData } = useStore()

  return (
    <div className="space-y-10 md:px-0">
      <div>
        <h3>Subscription plans</h3>
        <p className="font-medium pt-4 text-sm">
          The project will be permanently deleted, including its deployments and
          domains. This action is irreversible and can not be undone.
        </p>
      </div>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Current Plan</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row md:space-y-0 space-y-4">
          <div className="flex justify-start w-1/2">
            You are currently on the plan{" "}
            <Badge className="mx-2 primary h-6">{orgData?.tier}</Badge>
          </div>
          <div className="flex flex-col justify-end w-1/2 items-center px-6 pb-6">
            <div>
              <div className="flex justify-start w-full">
                <Package className="mr-2" />
                <h4 className="font-semibold">{orgData?.tier}</h4>
              </div>
              <div className="text-sm justify-start w-full py-3 ml-8">
                2/2 custom domains <br />
                2/2 organizations <br />
                1/5 users <br />
                water print for builderai <br />
                5K views per month <br />
                <br />
                billing cycle: <b>15 May - 15 June, 2023</b>
              </div>
              <div className="py-4">
                Fre plan is perfect for testing pages and increase awaerness,
                you can check all features{" "}
                <PricingDialog cta={"View features"} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Available plans</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row md:space-y-0 space-y-4">
          <div className="flex justify-start w-1/2">
            These are the new plans you can pick to upgrade subscriptions
          </div>
          <div className="flex flex-col justify-end w-1/2 items-center px-6 pb-6">
            <div>
              <div className="flex justify-start w-full">
                <Package className="mr-2" />
                <h4 className="font-semibold">PRO</h4>
              </div>
              <div className="text-sm justify-start w-full py-3 ml-8">
                2/2 custom domains <br />
                2/2 organizations <br />
                1/5 users <br />
                water print for builderai <br />
                5K views per month <br />
                <br />
                billing cycle: <b>15 May - 15 June, 2023</b>
              </div>
              <div className="py-4">
                Fre plan is perfect for testing pages and increase awaerness,
                you can check all features <PricingDialog cta={"Upgrade"} />
              </div>
            </div>
            <Separator className="my-8" />
            <div>
              <div className="flex justify-start w-full">
                <Package className="mr-2" />
                <h4 className="font-semibold">CUSTOM</h4>
              </div>
              <div className="text-sm justify-start w-full py-3 ml-8">
                2/2 custom domains <br />
                2/2 organizations <br />
                1/5 users <br />
                water print for builderai <br />
                5K views per month <br />
                <br />
                billing cycle: <b>15 May - 15 June, 2023</b>
              </div>

              <div className="py-4">
                Fre plan is perfect for testing pages and increase awaerness,
                you can check all features <PricingDialog cta={"Upgrade"} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
