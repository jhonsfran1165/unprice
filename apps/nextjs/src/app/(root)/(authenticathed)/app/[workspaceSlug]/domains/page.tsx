import { api } from "~/trpc/server"

export default async function PageDomains() {
  // TODO: get limits of this project for this workspace
  const domain = await api.domains.getDomains()

  console.log(domain)

  return <>testing</>
}
