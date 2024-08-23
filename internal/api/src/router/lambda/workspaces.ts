import { TRPCError } from "@trpc/server"
import { and, eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import {
  inviteMembersSchema,
  invitesSelectBase,
  listMembersSchema,
  membersSelectBase,
  workspaceInsertBase,
  workspaceSelectBase,
  workspaceSignupSchema,
} from "@unprice/db/validators"
import { WelcomeEmail, sendEmail } from "@unprice/email"
import { z } from "zod"
import {
  createTRPCRouter,
  protectedActiveWorkspaceOwnerProcedure,
  protectedActiveWorkspaceProcedure,
  protectedProcedure,
} from "../../trpc"
import { createWorkspace, signUpCustomer } from "../../utils/shared"

export const workspaceRouter = createTRPCRouter({
  create: protectedActiveWorkspaceOwnerProcedure
    .input(
      workspaceInsertBase.required({
        name: true,
        unPriceCustomerId: true,
      })
    )
    .output(
      z.object({
        workspace: workspaceSelectBase,
      })
    )
    .mutation(async (opts) => {
      const newWorkspace = await createWorkspace({
        input: opts.input,
        ctx: opts.ctx,
      })

      return {
        workspace: newWorkspace,
      }
    }),
  signUp: protectedProcedure
    .input(workspaceSignupSchema)
    .output(
      z.object({
        workspace: workspaceSelectBase,
      })
    )
    .mutation(async (opts) => {
      const { name, planVersionId, config, successUrl, cancelUrl } = opts.input
      const user = opts.ctx.session?.user

      // first sign up the customer
      const { success, error, customerId } = await signUpCustomer({
        input: {
          email: user.email,
          name: name,
          planVersionId,
          config,
          successUrl,
          cancelUrl,
        },
        ctx: opts.ctx,
        // default project ID - unprice admin
        projectId: "proj_uhV7tetPJwCZAMox3L7Po4H5dgc",
      })

      if (!success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error ?? "Failed to sign up customer",
        })
      }

      const newWorkspace = await createWorkspace({
        input: {
          name: name,
          unPriceCustomerId: customerId,
          isPersonal: false,
          isInternal: false,
          createdBy: user.id,
        },
        ctx: opts.ctx,
      })

      if (!newWorkspace) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create workspace",
        })
      }

      return {
        workspace: newWorkspace,
      }
    }),
  deleteMember: protectedActiveWorkspaceOwnerProcedure
    .input(
      z.object({
        userId: z.string(),
        workspaceId: z.string(),
      })
    )
    .output(
      z.object({
        member: membersSelectBase,
      })
    )
    .mutation(async (opts) => {
      const { userId, workspaceId } = opts.input
      const workspace = opts.ctx.workspace

      if (workspace.id !== workspaceId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Workspace not found",
        })
      }

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
        where: (workspace, operators) => operators.and(operators.eq(workspace.id, workspaceId)),
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
          and(eq(schema.members.workspaceId, workspace.id), eq(schema.members.userId, user.id))
        )
        .returning()
        .then((members) => members[0] ?? undefined)

      if (!deletedMember) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error deleting member",
        })
      }

      return {
        member: deletedMember,
      }
    }),
  listMembersByActiveWorkspace: protectedActiveWorkspaceProcedure
    .input(z.void())
    .output(
      z.object({
        members: z.array(listMembersSchema),
      })
    )
    .query(async (opts) => {
      const workspace = opts.ctx.workspace

      const members = await opts.ctx.db.query.members.findMany({
        with: {
          user: true,
          workspace: true,
        },
        where: (member, { eq, and }) => and(eq(member.workspaceId, workspace.id)),
        orderBy: (members) => members.createdAtM,
      })

      return {
        members: members,
      }
    }),
  getBySlug: protectedActiveWorkspaceProcedure
    .input(workspaceSelectBase.pick({ slug: true }))
    .output(
      z.object({
        workspace: workspaceSelectBase,
      })
    )
    .query(async (opts) => {
      const { slug } = opts.input

      const workspace = await opts.ctx.db.query.workspaces.findFirst({
        where: eq(schema.workspaces.slug, slug),
      })

      if (!workspace) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workspace not found",
        })
      }

      return {
        workspace: workspace,
      }
    }),

  delete: protectedActiveWorkspaceProcedure
    .input(workspaceSelectBase.pick({ id: true }))
    .output(z.object({ workspace: workspaceSelectBase.optional() }))
    .mutation(async (opts) => {
      const { id } = opts.input
      const workspace = opts.ctx.workspace

      if (workspace.id !== id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This id is not the active workspace",
        })
      }

      if (workspace?.isPersonal) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete personal workspace. Contact support to delete your account.",
        })
      }

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
  listWorkspacesByActiveUser: protectedProcedure
    .input(z.void())
    .output(
      z.object({
        workspaces: z.array(
          workspaceSelectBase.extend({
            role: z.string(),
            userId: z.string(),
          })
        ),
      })
    )
    .query(async (opts) => {
      const userId = opts.ctx.session?.user?.id

      const memberships = await opts.ctx.db.query.members.findMany({
        with: {
          workspace: true,
        },
        where: (member, operators) => operators.eq(member.userId, userId),
        orderBy: (member) => member.createdAtM,
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
  rename: protectedActiveWorkspaceOwnerProcedure
    .input(workspaceSelectBase.pick({ name: true }))
    .output(workspaceSelectBase)
    .mutation(async (opts) => {
      const { name } = opts.input
      const workspace = opts.ctx.workspace

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

  changeRoleMember: protectedActiveWorkspaceOwnerProcedure
    .input(membersSelectBase.pick({ userId: true, role: true }))
    .output(z.object({ member: membersSelectBase.optional() }))
    .mutation(async (opts) => {
      const { userId, role } = opts.input
      const workspace = opts.ctx.workspace

      const member = await opts.ctx.db
        .update(schema.members)
        .set({ role })
        .where(and(eq(schema.members.workspaceId, workspace.id), eq(schema.members.userId, userId)))
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
  listInvitesByActiveWorkspace: protectedActiveWorkspaceProcedure
    .input(z.void())
    .output(
      z.object({
        invites: z.array(invitesSelectBase),
      })
    )
    .query(async (opts) => {
      const workspace = opts.ctx.workspace

      const invites = await opts.ctx.db.query.invites.findMany({
        where: eq(schema.invites.workspaceId, workspace.id),
      })

      return {
        invites: invites,
      }
    }),
  deleteInvite: protectedActiveWorkspaceOwnerProcedure
    .input(
      z.object({
        email: z.string().email(),
        workspaceId: z.string(),
      })
    )
    .output(
      z.object({
        invite: invitesSelectBase,
      })
    )
    .mutation(async (opts) => {
      const { email, workspaceId } = opts.input

      const workspace = await opts.ctx.db.query.workspaces.findFirst({
        where: eq(schema.workspaces.id, workspaceId),
      })

      if (!workspace) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workspace not found",
        })
      }

      const deletedInvite = await opts.ctx.db
        .delete(schema.invites)
        .where(and(eq(schema.invites.email, email), eq(schema.invites.workspaceId, workspace.id)))
        .returning()
        .then((inv) => inv[0] ?? undefined)

      if (!deletedInvite) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error deleting invite",
        })
      }

      return {
        invite: deletedInvite,
      }
    }),
  inviteMember: protectedActiveWorkspaceOwnerProcedure
    .input(inviteMembersSchema)
    .output(
      z.object({
        invite: invitesSelectBase.optional(),
      })
    )
    .mutation(async (opts) => {
      const { email, role } = opts.input
      const workspace = opts.ctx.workspace

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
        }
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
            : "Sebastian Franco <sebastian@unprice.dev>",
        subject: "Welcome to Unprice 👋",
        to: [email],
        react: WelcomeEmail(),
      })

      return {
        invite: memberInvited,
      }
    }),
})
