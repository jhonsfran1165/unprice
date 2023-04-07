import { createServerClient } from "@/lib/supabase/supabase-server"
import { OrganizationForm } from "@/components/organizations/organization-form"
import { Card } from "@/components/shared/card"

// TODO: introduce example framer motion
// https://www.josephcollicoat.com/articles/animating-text-with-the-intersection-observer-api-and-framer-motion

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

  const org = orgsProfile?.organization
  const isDefault = orgsProfile?.is_default

  return (
    <div className="md:px-0">
      <Card className="mb-10">
        <OrganizationForm org={org} />
      </Card>
      <Card className="mb-10 h-36">jhoan</Card>
      <Card className="mb-10 h-36">jhoan</Card>
      <Card className="mb-10 h-36">jhoan</Card>
      <Card className="mb-10 h-36">jhoan</Card>
      <Card className="mb-10 h-36">jhoan</Card>
      <Card className="mb-10 h-36">jhoan</Card>
      <Card className="mb-10 h-36">jhoan</Card>
    </div>
  )
}
