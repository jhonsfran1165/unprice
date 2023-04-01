import { notFound } from "next/navigation"

import { createServerClient } from "@/lib/supabase/supabase-server"

export default async function DashboardLayout({
  children,
  params: { projectId, orgSlug },
}: {
  children: React.ReactNode
  params: {
    projectId: string
    orgSlug: string
  }
}) {
  const supabase = createServerClient()

  const { data: project } = await supabase
    .from("project")
    .select("*, organization!inner(*)")
    .eq("id", projectId)
    .eq("organization.slug", orgSlug)
    .single()

  if (!project) {
    notFound()
  }

  return children
}
