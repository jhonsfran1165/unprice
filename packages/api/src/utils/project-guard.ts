import { TRPCError } from "@trpc/server"

import { eq, prepared, schema } from "@builderai/db"
import type { Project } from "@builderai/validators/project"
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
  project: Project & { workspace: SelectWorkspace }
}> => {
  const activeWorkspaceSlug = ctx.activeWorkspaceSlug

  if (activeWorkspaceSlug === "" || !activeWorkspaceSlug) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No active workspace in the session",
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

  // we execute this in a prepared statement to improve performance
  // INFO: keep in mind that this executes outside of the context of trpc
  const projectsWithWorkspace =
    await prepared.projectsWithWorkspacesPrepared.execute({
      id: projectId,
      slug: projectSlug,
    })

  const projectBelonsToWorkspace =
    projectsWithWorkspace?.workspace.slug === activeWorkspaceSlug

  // the user doesn't have access to this workspace
  if (!projectBelonsToWorkspace) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Project not found or you don't have access to this project",
    })
  }

  return {
    project: projectsWithWorkspace,
  }
}
