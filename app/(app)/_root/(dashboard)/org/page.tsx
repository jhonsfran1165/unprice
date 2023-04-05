import { OrganizationForm } from "@/components/organizations/organization-form"

// do not cache this layout because it validates the session constantly
export const revalidate = 0
// export const dynamic = "force-dynamic"

// TODO: pass search params to make diferrent actions
export default async function AppInitialPage(data) {
  // console.log(data)
  return <OrganizationForm />
}
