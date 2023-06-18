import { notFound } from "next/navigation"

import { createServerClient } from "@/lib/supabase/supabase-server"

export default async function DashboardLayout({
  children,
  params: { projectSlug },
}: {
  children: React.ReactNode
  params: {
    projectSlug: string
  }
}) {
  const supabase = createServerClient()

  const { data: project, error } = await supabase
    .from("project")
    .select("id")
    .eq("slug", projectSlug)
    .single()

  if (!project) {
    notFound()
  }

  return children
}
