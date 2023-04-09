import { notFound } from "next/navigation"

import { createServerClient } from "@/lib/supabase/supabase-server"

export default async function DashboardLayout({
  children,
  params: { projectSlug, orgSlug },
}: {
  children: React.ReactNode
  params: {
    projectSlug: string
    orgSlug: string
  }
}) {
  const supabase = createServerClient()

  const { data: project, error } = await supabase
    .from("project")
    .select("*, organization!inner(*)")
    .eq("slug", projectSlug)
    .eq("organization.slug", orgSlug)
    .single()

  if (!project) {
    notFound()
  }

  return children
}
