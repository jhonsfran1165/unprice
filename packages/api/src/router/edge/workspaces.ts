import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { and, eq } from "@builderai/db"
import * as schema from "@builderai/db/schema"
import {
  changeRoleMemberSchema,
  deleteWorkspaceSchema,
  inviteMembersSchema,
  invitesSelectBase,
  listMembersSchema,
  membersSelectBase,
  renameWorkspaceSchema,
  searchDataParamsSchema,
  selectWorkspaceSchema,
} from "@builderai/db/validators"
import { sendEmail, WelcomeEmail } from "@builderai/email"

import {
  createTRPCRouter,
  protectedActiveWorkspaceOwnerProcedure,
  protectedProcedure,
} from "../../trpc"
import { workspaceGuard } from "../../utils/workspace-guard"

export const workspaceRouter = createTRPCRouter({
  deleteMember: protectedActiveWorkspaceOwnerProcedure
    .input(
      z.object({
        userId: z.string(),
        workspaceId: z.string(),
      })
    )
    .output(
      z.object({
        member: membersSelectBase.optional(),
      })
    )
    .mutation(async (opts) => {
      const { userId, workspaceId } = opts.input
      const { workspace } = await workspaceGuard({
        ctx: opts.ctx,
        workspaceId,
      })

      // if the user only has one workspace, they cannot delete themselves
      if (workspace.isPersonal) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete yourself from personal workspace",
        })
      }

      const user = await opts.ctx.db.query.users.findFirst({
        where: eq(schema.users.id, userId),
      })

      if (!user?.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        })
      }

      // if the user is the only owner, they cannot delete themselves
      const ownerCount = await opts.ctx.db.query.workspaces.findFirst({
        with: {
          members: true,
        },
        where: (workspace, operators) =>
          operators.and(operators.eq(workspace.id, workspaceId)),
      })

      if (ownerCount && ownerCount.members.length <= 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete the only owner of the workspace",
        })
      }

      const deletedMember = await opts.ctx.db
        .delete(schema.members)
        .where(
          and(
            eq(schema.members.workspaceId, workspace.id),
            eq(schema.members.userId, user.id)
          )
        )
        .returning()
        .then((members) => members[0] ?? undefined)

      return {
        member: deletedMember,
      }
    }),
  // TODO: add pagination
  listMembers: protectedProcedure
    .input(
      searchDataParamsSchema.extend({
        workspaceSlug: selectWorkspaceSchema.shape.slug,
      })
    )
    .output(
      z.object({
        members: z.array(listMembersSchema),
      })
    )
    .query(async (opts) => {
      const { workspaceSlug, fromDate, toDate } = opts.input

      const { workspace } = await workspaceGuard({
        ctx: opts.ctx,
        workspaceSlug,
      })

      const members = await opts.ctx.db.query.members.findMany({
        with: {
          user: true,
          workspace: true,
        },
        where: (member, { eq, and, between, gte, lte }) =>
          and(
            eq(member.workspaceId, workspace.id),
            fromDate && toDate
              ? between(member.createdAt, new Date(fromDate), new Date(toDate))
              : undefined,
            fromDate ? gte(member.createdAt, new Date(fromDate)) : undefined,
            toDate ? lte(member.createdAt, new Date(toDate)) : undefined
          ),
        orderBy: (members) => members.createdAt,
      })

      return {
        members: members,
      }
    }),
  getBySlug: protectedProcedure
    .input(selectWorkspaceSchema.pick({ slug: true }))
    .output(
      z.object({
        workspace: selectWorkspaceSchema.optional(),
      })
    )
    .query(async (opts) => {
      const { slug: workspaceSlug } = opts.input

      const { workspace } = await workspaceGuard({
        ctx: opts.ctx,
        workspaceSlug,
      })

      return {
        workspace: workspace,
      }
    }),

  delete: protectedProcedure
    .input(deleteWorkspaceSchema)
    .output(z.object({ workspace: selectWorkspaceSchema.optional() }))
    .mutation(async (opts) => {
      const { slug: workspaceSlug } = opts.input

      const { workspace, verifyRole } = await workspaceGuard({
        ctx: opts.ctx,
        workspaceSlug,
      })

      if (workspace?.isPersonal) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Cannot delete personal workspace. Contact support to delete your account.",
        })
      }

      verifyRole(["OWNER"])

      const deletedWorkspace = await opts.ctx.db
        .delete(schema.workspaces)
        .where(eq(schema.workspaces.id, workspace.id))
        .returning()
        .then((wk) => wk[0] ?? undefined)

      if (!deletedWorkspace) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error deleting workspace",
        })
      }

      return {
        workspace: deletedWorkspace,
      }
    }),
  listWorkspaces: protectedProcedure
    .input(z.void())
    .output(
      z.object({
        workspaces: z.array(
          selectWorkspaceSchema
            .pick({
              id: true,
              name: true,
              slug: true,
              imageUrl: true,
              isPersonal: true,
            })
            .extend({
              role: z.string(),
              userId: z.string(),
            })
        ),
      })
    )
    .query(async (opts) => {
      const userId = opts.ctx.session?.user?.id

      if (!userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "userId not provided, logout and login again",
        })
      }

      const memberships = await opts.ctx.db.query.members.findMany({
        with: {
          workspace: {
            columns: {
              id: true,
              name: true,
              slug: true,
              imageUrl: true,
              isPersonal: true,
            },
          },
        },
        where: (members, operators) => operators.eq(members.userId, userId),
        orderBy: (members) => members.createdAt,
      })

      const workspaces = memberships.map((member) => ({
        ...member.workspace,
        role: member.role,
        userId: member.userId,
      }))

      return {
        workspaces: workspaces,
      }
    }),
  renameWorkspace: protectedProcedure
    .input(renameWorkspaceSchema)
    .output(selectWorkspaceSchema)
    .mutation(async (opts) => {
      const { slug: workspaceSlug, name } = opts.input

      const { workspace, verifyRole } = await workspaceGuard({
        ctx: opts.ctx,
        workspaceSlug,
      })

      verifyRole(["OWNER", "ADMIN"])

      const workspaceRenamed = await opts.ctx.db
        .update(schema.workspaces)
        .set({ name })
        .where(eq(schema.workspaces.id, workspace.id))
        .returning()
        .then((wk) => wk[0] ?? undefined)

      if (!workspaceRenamed) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error updating workspace",
        })
      }

      return workspaceRenamed
    }),

  changeRoleMember: protectedProcedure
    .input(changeRoleMemberSchema)
    .output(z.object({ member: membersSelectBase.optional() }))
    .mutation(async (opts) => {
      const { workspaceId, userId, role } = opts.input

      const { workspace, verifyRole } = await workspaceGuard({
        ctx: opts.ctx,
        workspaceId,
      })

      verifyRole(["OWNER", "ADMIN"])

      const member = await opts.ctx.db
        .update(schema.members)
        .set({ role })
        .where(
          and(
            eq(schema.members.workspaceId, workspace.id),
            eq(schema.members.userId, userId)
          )
        )
        .returning()
        .then((wk) => wk[0] ?? undefined)

      if (!member) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error updating workspace",
        })
      }

      return {
        member: member,
      }
    }),
  inviteMember: protectedProcedure
    .input(inviteMembersSchema)
    .output(
      z.object({
        invite: invitesSelectBase.optional(),
      })
    )
    .mutation(async (opts) => {
      const { email, workspaceSlug, role } = opts.input

      const { workspace } = await workspaceGuard({
        ctx: opts.ctx,
        workspaceSlug,
      })

      // check if the user has an account
      const userByEmail = await opts.ctx.db.query.users.findFirst({
        where: eq(schema.users.email, email),
      })

      if (userByEmail) {
        // check if the user is already a member of the workspace
        const member = await opts.ctx.db.query.members.findFirst({
          where: and(
            eq(schema.members.userId, userByEmail.id),
            eq(schema.members.workspaceId, workspace.id)
          ),
        })

        if (member) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "User is already a member of the workspace",
          })
        } else {
          // add the user as a member of the workspace
          await opts.ctx.db.insert(schema.members).values({
            userId: userByEmail.id,
            workspaceId: workspace.id,
            role: role,
          })

          // no need to send an invite email
          return {
            invite: undefined,
          }
        }
      }

      const memberInvited = await opts.ctx.db
        .insert(schema.invites)
        .values({
          email: email,
          workspaceId: workspace.id,
          role: role,
        })
        .returning()
        .then((res) => {
          return res[0]
        })

      // send the invite email
      await sendEmail({
        from:
          process.env.NODE_ENV === "development"
            ? "delivered@resend.dev"
            : "Sebastian Franco <sebastian@builderai.com>",
        subject: "Welcome to Builderai 👋",
        to: [email],
        react: WelcomeEmail(),
      })

      return {
        invite: memberInvited,
      }
    }),
})
