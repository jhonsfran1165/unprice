import { notFound } from "next/navigation"

import { db } from "@builderai/db"

export async function userCanAccessProject({
  projectSlug,
  workspaceSlug,
}: {
  projectSlug: string
  workspaceSlug: string
}) {
  if (!projectSlug || !workspaceSlug) {
    return
  }

  // TODO: review this process - clean context db connection
  // await deactivateRLS(db)()

  const projectData = await db.query.project.findFirst({
    columns: {
      slug: true,
    },
    with: {
      workspace: {
        columns: {
          slug: true,
        },
      },
    },
    where: (project, { eq }) => eq(project.slug, projectSlug),
  })

  // don't have access
  if (!projectData || projectData.workspace.slug !== workspaceSlug) {
    notFound()
  }
}
