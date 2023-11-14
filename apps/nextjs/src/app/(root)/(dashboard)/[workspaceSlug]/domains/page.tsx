import { api } from "~/trpc/server"

export const runtime = "edge"

export default async function PageDomains() {
  // TODO: get limits of this project for this workspace
  const domain = await api.domain.getDomains.query()

  console.log(domain)

  return <>testing</>
}
