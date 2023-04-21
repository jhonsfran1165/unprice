import { Suspense } from "react"
import { BellRing, Check } from "lucide-react"

import { createServerClient } from "@/lib/supabase/supabase-server"
import { Organization, OrganizationViewData } from "@/lib/types/supabase"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { OrganizationDelete } from "@/components/organizations/organization-delete"
import { OrganizationForm } from "@/components/organizations/organization-form"
import { OrganizationMakeDefault } from "@/components/organizations/organization-make-default"

// import { Card } from "@/components/shared/card"

// TODO: introduce example framer motion
// https://www.josephcollicoat.com/articles/animating-text-with-the-intersection-observer-api-and-framer-motion
export const revalidate = 0

export default async function OrgSettingsIndexPage({
  params: { orgSlug },
}: {
  params: {
    orgSlug: string
  }
}) {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { data: dataOrg, error } = await supabase
    .from("data_orgs")
    .select("*, organization(*)")
    .eq("profile_id", session?.user.id)
    .eq("org_slug", orgSlug)
    .eq("organization.slug", orgSlug)
    .single()

  console.log(error)

  const org = dataOrg?.organization as Organization

  return (
    <div className="space-y-10 md:px-0">
      <OrganizationForm org={org} />

      <OrganizationMakeDefault
        orgSlug={org.slug}
        id={org.id}
        isDefault={dataOrg?.is_default ?? false}
      />

      <OrganizationDelete
        orgSlug={org.slug}
        id={org.id}
        isDefault={dataOrg?.is_default ?? false}
      />

      {/* <Suspense fallback={<div>Loading...</div>}>
        <CardDemo />
      </Suspense> */}
    </div>
  )
}
