import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { clerkClient } from "@builderai/auth"
import {
  inviteOrgMemberSchema,
  selectWorkspaceSchema,
} from "@builderai/validators/workspace"

import {
  createTRPCRouter,
  protectedOrgAdminProcedure,
  protectedOrgProcedure,
} from "../../trpc"

// this router controls organizations from Clerk.
// Workspaces are similar to organizations in Clerk
// We sync the two to keep the data consistent (see @builderai/auth webhooks)
export const workspaceRouter = createTRPCRouter({
  listWorkspaces: protectedOrgProcedure
    .input(z.void())
    .output(
      z.array(
        selectWorkspaceSchema.pick({
          id: true,
          name: true,
          createdAt: true,
        })
      )
    )
    .query(async (opts) => {
      const { userId, orgId } = opts.ctx.auth

      if (!userId && !orgId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "userId/orgId not provided, logout and login again",
        })
      }

      const tenantId = orgId ?? userId

      const workspaces = await opts.ctx.db.query.workspaces.findMany({
        where(workspace, { eq, or }) {
          return or(eq(workspace.tenantId, tenantId))
        },
      })

      return workspaces.map((wk) => ({
        id: wk.id,
        name: wk.name,
        createdAt: wk.createdAt,
      }))
    }),
  listMembers: protectedOrgProcedure.query(async (opts) => {
    const { orgId } = opts.ctx.auth

    if (!orgId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "orgId not provided, logout and login again",
      })
    }

    const members =
      await clerkClient.organizations.getOrganizationMembershipList({
        organizationId: orgId,
      })

    return members.map((member) => ({
      id: member.id,
      email: member.publicUserData?.identifier ?? "",
      role: member.role,
      joinedAt: member.createdAt,
      avatarUrl: member.publicUserData?.imageUrl,
      name: [
        member.publicUserData?.firstName,
        member.publicUserData?.lastName,
      ].join(" "),
    }))
  }),

  deleteMember: protectedOrgAdminProcedure
    .input(z.object({ userId: z.string() }))
    .output(z.object({ memberName: z.string().optional().nullable() }))
    .mutation(async (opts) => {
      const { orgId } = opts.ctx.auth

      if (!orgId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "orgId not provided, logout and login again",
        })
      }

      try {
        const member =
          await clerkClient.organizations.deleteOrganizationMembership({
            organizationId: orgId,
            userId: opts.input.userId,
          })

        return { memberName: member.publicUserData?.firstName }
      } catch (e) {
        console.error("Error deleting member", e)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        })
      }
    }),

  inviteMember: protectedOrgAdminProcedure
    .input(inviteOrgMemberSchema)
    .mutation(async (opts) => {
      const { orgId } = opts.ctx.auth

      const { email } = opts.input
      const users = await clerkClient.users.getUserList({
        emailAddress: [email],
      })
      const user = users[0]

      if (users.length === 0 || !user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        })
      }

      if (users.length > 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Multiple users found with that email address",
        })
      }

      if (!orgId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "orgId not provided",
        })
      }

      const member =
        await clerkClient.organizations.createOrganizationMembership({
          organizationId: orgId,
          userId: user.id,
          role: opts.input.role,
        })

      const { firstName, lastName } = member.publicUserData ?? {}
      return { name: [firstName, lastName].join(" ") }
    }),

  deleteOrganization: protectedOrgAdminProcedure.mutation(async (opts) => {
    const { orgId } = opts.ctx.auth

    if (!orgId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "orgId not provided",
      })
    }

    await clerkClient.organizations.deleteOrganization(orgId)
  }),
})
