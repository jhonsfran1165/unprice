import { TRPCError } from "@trpc/server"

import { and, eq } from "@builderai/db"
import type { SelectProject, SelectWorkspace } from "@builderai/db/schema"
import { project } from "@builderai/db/schema"

import type { Context } from "./trpc"

export const hasAccessToProject = async ({
  projectSlug,
  projectId,
  tenantId,
  ctx,
}: {
  projectId?: string
  projectSlug?: string
  tenantId?: string
  ctx: Context
}): Promise<{
  project: SelectProject & { workspace: SelectWorkspace }
}> => {
  // if tenant provided look to that otherwise set it as tenantId from the context
  const tenant = tenantId ? tenantId : ctx.tenantId

  const condition = projectId
    ? eq(project.id, projectId)
    : projectSlug && eq(project.slug, projectSlug)

  if (!condition) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Has to provide project id or project slug",
    })
  }

  const currentProject = await ctx.db.query.project.findFirst({
    with: { workspace: true },
    where: and(condition, eq(project.tenantId, tenant)),
  })

  // the tenantId doesn't have access to this workspace
  if (!currentProject) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Project not found or you don't have access to this project",
    })
  }

  return {
    project: currentProject,
  }
}
