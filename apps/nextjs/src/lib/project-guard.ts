import { notFound } from "next/navigation"

import type { ProjectTier } from "@builderai/config"

import { api } from "~/trpc/server-http"

export async function userCanAccessProject({
  projectSlug,
  needsToBeInTier = ["FREE"],
}: {
  projectSlug: string
  needsToBeInTier?: ProjectTier[]
}) {
  if (!projectSlug) {
    notFound()
  }

  const { haveAccess, isInTier } = await api.project.canAccessProject.query({
    slug: projectSlug,
    needsToBeInTier,
  })

  if (!haveAccess) {
    throw new Error("You don't have access to this project")
  }

  if (!isInTier) {
    throw new Error(
      "This project is not in the right tier for this page, update you plan"
    )
  }
}
