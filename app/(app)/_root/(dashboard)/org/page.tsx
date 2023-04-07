import { OrganizationContainer } from "@/components/organizations/organization-container"

// TODO: pass search params to make diferrent actions
export default async function AppInitialPage(data) {
  console.log(data)
  return <OrganizationContainer />
}
