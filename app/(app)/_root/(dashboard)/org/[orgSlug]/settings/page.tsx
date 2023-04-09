import { createServerClient } from "@/lib/supabase/supabase-server"
import { Organization } from "@/lib/types/supabase"
import { OrganizationDelete } from "@/components/organizations/organization-delete"
import { OrganizationForm } from "@/components/organizations/organization-form"
import { OrganizationMakeDefault } from "@/components/organizations/organization-make-default"
import { Card } from "@/components/shared/card"

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

  const { data: orgsProfile } = await supabase
    .from("organization_profiles")
    .select("*, organization!inner(*)")
    .eq("profile_id", session?.user.id)
    .eq("organization.slug", orgSlug)
    .single()

  const org = orgsProfile?.organization as Organization
  const isDefault = orgsProfile?.is_default

  return (
    <div className="md:px-0">
      <Card className="mb-10">
        {/* <div className="flex flex-col space-y-6 px-4 py-5 sm:px-10">
          <h3>Delete Organization</h3>
          <p className="text-sm">
            The project will be permanently deleted, including its deployments
            and domains. This action is irreversible and can not be undone.
          </p>
        </div>   */}
        <OrganizationForm org={org} />
      </Card>

      <Card className="mb-10">
        <OrganizationMakeDefault
          orgSlug={org.slug}
          id={org.id}
          isDefault={isDefault}
        />
      </Card>

      <Card className="mb-10 border-danger-solid">
        <OrganizationDelete
          orgSlug={org.slug}
          id={org.id}
          isDefault={isDefault}
        />
      </Card>
    </div>
  )
}
