import { notFound } from "next/navigation"

import { createServerClient } from "@/lib/supabase/supabase-server"

export const revalidate = 0

export default async function DashboardLayout({
  children,
  params: { orgSlug },
}: {
  children: React.ReactNode
  params: {
    orgSlug: string
  }
}) {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { data: claim, error } = await supabase.rpc("get_claim", {
    user_id: session?.user.id ?? "",
    claim: "organizations",
  })

  // TODO: if error throws an error

  // we don't rely on the JWT for checking if the organization belongs to the user
  // because JWT has the problem with refreshing token.
  // this adds unnecessary request to the database, with more reason if this is a centrla layout
  // but for now it is okay
  const orgExist =
    claim && Object.keys(claim).find((key) => claim[key].slug === orgSlug)

  if (!orgExist) {
    notFound()
  }

  return children
}
