import { notFound } from "next/navigation"

import type { WorkspacePlan } from "@builderai/db/validators"

import { api } from "~/trpc/server"

export async function userCanAccessProject({
  projectSlug,
  needsToBeInTier = ["FREE", "PRO"],
}: {
  projectSlug: string
  needsToBeInTier?: WorkspacePlan[]
}) {
  if (!projectSlug) {
    notFound()
  }

  const { haveAccess, isInTier } = await api.projects.canAccessProject({
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
