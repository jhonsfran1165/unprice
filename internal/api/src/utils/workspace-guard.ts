import { TRPCError } from "@trpc/server"

import type { User, Workspace, WorkspaceRole } from "@unprice/db/validators"

import { workspaceGuardPrepared } from "@unprice/db/queries"
import type { Context } from "#trpc"

interface WorkspaceGuardType {
  workspace: Workspace
  member: User & { role: WorkspaceRole }
  verifyRole: (roles: WorkspaceRole[]) => void
}

export const workspaceGuard = async ({
  workspaceSlug,
  workspaceId,
  ctx,
}: {
  workspaceId?: string
  workspaceSlug?: string
  ctx: Context
}): Promise<WorkspaceGuardType> => {
  const userId = ctx.session?.user.id

  if (!workspaceId && !workspaceSlug) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Has to provide workspace id or workspace slug",
    })
  }

  if (!userId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No userId active in the session",
    })
  }

  const data = await workspaceGuardPrepared
    .execute({
      workspaceId,
      workspaceSlug,
      userId,
    })
    .then((response) => response[0] ?? null)

  const workspace = data?.workspace
  const member = data?.member as User & { role: WorkspaceRole }

  if (!member || !workspace) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Workspace not found or you don't have access to the workspace",
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
    workspace: workspace,
    member: member,
    verifyRole,
  }
}
