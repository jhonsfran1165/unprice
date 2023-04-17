import Link from "next/link"

import { createServerClient } from "@/lib/supabase/supabase-server"
import StripePortal from "@/components/dashboard/portal"
import Pricing from "@/components/dashboard/pricing"
import { Card } from "@/components/shared/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

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

  console.log(dataOrg)

  if (action === "upgrade") {
    return (
      <div className="md:px-0">
        <Pricing />
      </div>
    )
  }
  return (
    <div className="md:px-0">
      <Card className="mb-10">
        <div className="flex flex-col space-y-6 px-4 py-5 sm:px-10">
          <h3>Upgrade Subscrition</h3>
          <p className="text-sm font-light">
            The project will be permanently deleted, including its deployments
            and domains. This action is irreversible and can not be undone.
          </p>
          <Separator className="bg-background-border" />
          <Button className="w-28 border border-primary-border bg-primary-bg text-primary-text hover:border-primary-borderHover hover:bg-primary-bgHover hover:text-primary-textContrast active:bg-primary-bgActive">
            <Link href={`/org/${orgSlug}/settings/billing?action=upgrade`}>
              Upgrade
            </Link>
          </Button>
        </div>
      </Card>
      <Card className="mb-10">
        <div className="flex flex-col space-y-6 px-4 py-5 sm:px-10">
          <h3>Manage Subscrition</h3>
          <p className="text-sm font-light">
            The project will be permanently deleted, including its deployments
            and domains. This action is irreversible and can not be undone.
          </p>
          <Separator className="bg-background-border" />
          <StripePortal />
        </div>
      </Card>
    </div>
  )
}
