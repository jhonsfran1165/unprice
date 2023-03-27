import { notFound } from "next/navigation"

import { createServerClient } from "@/lib/supabase/supabase-server"

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: {
    projectId: string
    orgId: string
  }
}) {
  const supabase = createServerClient()

  const { data: project } = await supabase
    .from("project")
    .select("*")
    .eq("id", params.projectId)
    .eq("org_id", params.orgId)
    .single()

  if (!project) {
    notFound()
  }

  return children
}
