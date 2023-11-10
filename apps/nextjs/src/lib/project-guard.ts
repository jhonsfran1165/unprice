import { notFound } from "next/navigation"

import { api } from "~/trpc/server2"

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

  // TODO: create don't have access component
  if (!haveAccess) {
    notFound()
  }
}
