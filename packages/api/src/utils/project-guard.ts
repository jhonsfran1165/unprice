import { TRPCError } from "@trpc/server"

import { and, eq, schema } from "@builderai/db"
import type { SelectProject } from "@builderai/validators/project"
import type { SelectWorkspace } from "@builderai/validators/workspace"

import type { Context } from "../trpc"

export const hasAccessToProject = async ({
  projectSlug,
  projectId,
  ctx,
}: {
  projectId?: string
  projectSlug?: string
  ctx: Context
}): Promise<{
  project: SelectProject & { workspace: SelectWorkspace }
}> => {
  const workspaceId = ctx.workspaceId

  if (workspaceId === "") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Provide tenantId and workspaceId",
    })
  }

  const condition =
    (projectId && eq(schema.projects.id, projectId)) ??
    (projectSlug && eq(schema.projects.slug, projectSlug))

  if (!condition) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Has to provide project id or project slug",
    })
  }

  const currentProject = await ctx.db.query.projects.findFirst({
    with: { workspace: true },
    where: and(condition, eq(schema.projects.workspaceId, workspaceId)),
  })

  // the tenantId doesn't have access to this workspace
  if (!currentProject?.id) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Project not found or you don't have access to this project",
    })
  }

  return {
    project: currentProject,
  }
}
