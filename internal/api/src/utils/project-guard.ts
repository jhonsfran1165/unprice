import { TRPCError } from "@trpc/server"

import { projectGuardPrepared } from "@unprice/db/queries"
import type { Project } from "@unprice/db/validators"

import type { Context } from "../trpc"

export const projectGuard = async ({
  projectSlug,
  projectId,
  ctx,
}: {
  projectId?: string
  projectSlug?: string
  ctx: Context
}): Promise<Project> => {
  const userId = ctx.session?.user.id

  if (!userId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No userId active in the session",
    })
  }

  if (!projectId && !projectSlug) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Has to provide project id or project slug",
    })
  }

  // we execute this in a prepared statement to improve performance
  // INFO: keep in mind that this executes outside of the context of trpc
  // apart from checking the project is part of the workspace, we also check if the user has access to the workspace
  const data = await projectGuardPrepared
    .execute({
      projectId: projectId,
      projectSlug: projectSlug,
    })
    .then((response) => response[0] ?? null)

  const project = data?.project

  if (!project) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Project not found or you don't have access to the project",
    })
  }

  if (!project.enabled) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Project is disabled, please contact support",
    })
  }

  return project
}
