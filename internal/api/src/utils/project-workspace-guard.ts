import { TRPCError } from "@trpc/server"

import { projectWorkspaceGuardPrepared } from "@unprice/db/queries"
import type { ProjectExtended, User, WorkspaceRole } from "@unprice/db/validators"

import type { Context } from "../trpc"

interface ProjectGuardType {
  project: ProjectExtended
  member: User & { role: WorkspaceRole }
  verifyRole: (roles: WorkspaceRole[]) => void
}

export const projectWorkspaceGuard = async ({
  projectSlug,
  projectId,
  ctx,
}: {
  projectId?: string
  projectSlug?: string
  ctx: Context
}): Promise<ProjectGuardType> => {
  const userId = ctx.session?.user.id
  const workspaces = ctx.session?.user?.workspaces

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
  const data = await projectWorkspaceGuardPrepared
    .execute({
      projectId: projectId,
      projectSlug: projectSlug,
      userId,
    })
    .then((response) => response[0] ?? null)

  const project = data?.project
  const workspace = data?.workspace
  const member = data?.member as User & { role: WorkspaceRole }

  if (!member || !project || !workspace) {
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

  if (!workspace.enabled) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Workspace is disabled, please contact support",
    })
  }

  const activeWorkspace = workspaces?.find((workspace) => workspace.id === project.workspaceId)

  if (!activeWorkspace) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You are not a member of this workspace",
    })
  }

  const verifyRole = (roles: WorkspaceRole[]) => {
    if (roles && !roles.includes(member.role)) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: `You must be a member with roles (${roles.join(
          "/"
        )}) of this workspace to perform this action`,
      })
    }
  }

  // TODO: fix the query so we can we ProjectExtended without this
  return {
    project: {
      ...project,
      workspace,
    } as ProjectExtended,
    member: member,
    verifyRole,
  }
}
