import { notFound } from "next/navigation"

import { db, deactivateRLS } from "@builderai/db"

export async function userCanAccess({
  projectSlug,
  workspaceSlug,
}: {
  projectSlug: string
  workspaceSlug: string
}) {
  if (!projectSlug || !workspaceSlug) {
    return
  }

  // clean context db connection
  await deactivateRLS(db)()

  const projectData = await db.query.project.findFirst({
    with: {
      workspace: {
        columns: {
          slug: true,
        },
      },
    },
    where: (project, { eq }) => eq(project.slug, projectSlug),
  })

  if (!projectData) {
    notFound()
  }

  // don't have access
  if (projectData.workspace.slug !== workspaceSlug) {
    notFound()
  }
}
