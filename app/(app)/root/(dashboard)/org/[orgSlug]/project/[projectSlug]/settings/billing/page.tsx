import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import StripePortal from "@/components/subscriptions/portal"
import Pricing from "@/components/subscriptions/pricing"

export default async function IndexPage({
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
  if (action === "upgrade") {
    return (
      <div className="md:px-0">
        <Pricing type="ptivate" />
      </div>
    )
  }
  return (
    <div className="space-y-10 md:px-0">
      <Card>
        <CardHeader>
          <CardTitle>Usage</CardTitle>
          <CardDescription>
            The project will be permanently deleted, including its deployments
            and domains. This action is irreversible and can not be undone.
          </CardDescription>
        </CardHeader>

        <div className="flex items-center justify-center px-6 pb-6">
          <Separator />
        </div>

        <CardFooter>{/* // TODO: create usage card here */}</CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage Subscrition</CardTitle>
          <CardDescription>
            The project will be permanently deleted, including its deployments
            and domains. This action is irreversible and can not be undone.
          </CardDescription>
        </CardHeader>

        <div className="flex items-center justify-center px-6 pb-6">
          <Separator />
        </div>

        <CardFooter>
          <StripePortal />
        </CardFooter>
      </Card>
    </div>
  )
}
