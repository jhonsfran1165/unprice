import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { selectWorkspaceSchema } from "@builderai/validators/workspace"

import {
  createTRPCRouter,
  protectedProcedure,
  protectedWorkspaceOwnerProcedure,
} from "../../trpc"

export const authRouter = createTRPCRouter({
  // TODO: this should query the user's active subscriptions
  mySubscription: protectedWorkspaceOwnerProcedure
    .input(z.void())
    .output(
      z.object({
        subscription: selectWorkspaceSchema
          .pick({
            plan: true,
            billingPeriodEnd: true,
            billingPeriodStart: true,
          })
          .optional(),
      })
    )
    .query(async (opts) => {
      const activeWorkspaceSlug = opts.ctx.activeWorkspaceSlug

      const workspace = await opts.ctx.db.query.workspaces.findFirst({
        columns: {
          plan: true,
          billingPeriodStart: true,
          billingPeriodEnd: true,
        },
        where: (workspace, { eq }) => eq(workspace.slug, activeWorkspaceSlug),
      })

      if (!workspace?.plan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workspace not found",
        })
      }

      return {
        subscription: {
          plan: workspace.plan,
          billingPeriodEnd: workspace.billingPeriodEnd,
          billingPeriodStart: workspace.billingPeriodStart,
        },
      }
    }),
  listOrganizations: protectedProcedure.query(async (opts) => {
    const userId = opts.ctx.session.userId

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

    return memberships.map((members) => ({
      id: members.workspace.id,
      slug: members.workspace.slug,
      name: members.workspace.name,
      image: members.workspace.imageUrl,
    }))
  }),
})
