import { TRPCError } from "@trpc/server"

import { and, eq, schema } from "@builderai/db"
import type { SelectProject } from "@builderai/validators/project"
import type { SelectWorkspace } from "@builderai/validators/workspace"

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

  // some queries activate RLS but this has to bypass RLS
  await ctx.deactivateRLS()

  const condition =
    (projectId && eq(schema.project.id, projectId)) ??
    (projectSlug && eq(schema.project.slug, projectSlug))

  if (!condition) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Has to provide project id or project slug",
    })
  }

  const currentProject = await ctx.db.query.project.findFirst({
    with: { workspace: true },
    where: and(condition, eq(schema.project.tenantId, tenant)),
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
