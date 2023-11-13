import { notFound } from "next/navigation"

import { api } from "~/trpc/server"

export async function userCanAccessProject({
  projectSlug,
}: {
  projectSlug: string
}) {
  if (!projectSlug) {
    notFound()
  }

  const { haveAccess } = await api.project.canAccessProject.query({
    slug: projectSlug,
  })

  if (!haveAccess) {
    throw new Error("You don't have access to this project")
  }
}
