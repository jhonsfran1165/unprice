import Link from "next/link"

import { createServerClient } from "@/lib/supabase/supabase-server"
import { Button } from "@/components/ui/button"
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
  params: { orgSlug },
  searchParams: { action },
}: {
  params: {
    orgSlug: string
  }
  searchParams: {
    action: string
  }
}) {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { data: dataOrg } = await supabase
    .from("data_orgs")
    .select("*")
    .eq("profile_id", session?.user.id)
    .eq("org_slug", orgSlug)
    .single()

  if (action === "upgrade") {
    return (
      <div className="md:px-0">
        <Pricing />
      </div>
    )
  }
  return (
    <div className="space-y-10 md:px-0">
      <Card>
        <CardHeader>
          <CardTitle className="flex text-xl">Upgrade Subscrition</CardTitle>
          <CardDescription>
            The project will be permanently deleted, including its deployments
            and domains. This action is irreversible and can not be undone.
          </CardDescription>
        </CardHeader>

        <div className="flex items-center justify-center px-6 pb-6">
          <Separator />
        </div>

        <CardFooter>
          <Button className="button-primary w-28">
            <Link href={`/org/${orgSlug}/settings/billing?action=upgrade`}>
              Upgrade
            </Link>
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex text-xl">Manage Subscrition</CardTitle>
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
