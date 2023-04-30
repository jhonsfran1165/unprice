import { createServerClient } from "@/lib/supabase/supabase-server"
import { Organization } from "@/lib/types/supabase"
import { OrganizationDelete } from "@/components/organizations/organization-delete"
import { OrganizationForm } from "@/components/organizations/organization-form"
import { OrganizationMakeDefault } from "@/components/organizations/organization-make-default"

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
    .select("*, organization!inner(*)")
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
    </div>
  )
}
