import { TRPCError } from "@trpc/server"

import { prepared } from "@builderai/db"
import type {
  Project,
  User,
  Workspace,
  WorkspaceRole,
} from "@builderai/db/validators"

import type { Context } from "../trpc"

interface ProjectGuardType {
  project: Project
  workspace: Workspace
  member: User & { role: WorkspaceRole }
  verifyRole: (roles: WorkspaceRole[]) => void
}

export const projectGuard = async ({
  projectSlug,
  projectId,
  ctx,
}: {
  projectId?: string
  projectSlug?: string
  ctx: Context
}): Promise<ProjectGuardType> => {
  const activeWorkspaceSlug = ctx.activeWorkspaceSlug
  const userId = ctx.session?.user.id
  const workspaces = ctx.session?.user?.workspaces
  const activeWorkspace = workspaces?.find(
    (workspace) => workspace.slug === activeWorkspaceSlug
  )

  if (!activeWorkspace?.id) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No active workspace in the session",
    })
  }

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
  const data = await prepared.projectGuardPrepared
    .execute({
      projectId: projectId,
      projectSlug: projectSlug,
      workspaceId: activeWorkspace.id,
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

  return {
    project: project,
    workspace: workspace,
    member: member,
    verifyRole,
  }
}
