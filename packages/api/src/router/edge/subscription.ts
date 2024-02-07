import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { schema, utils } from "@builderai/db"
import {
  createSubscriptionSchema,
  createUserSchema,
} from "@builderai/validators/subscription"

import { createTRPCRouter, protectedOrgProcedure } from "../../trpc"
import { hasAccessToProject } from "../../utils"

export const subscriptionRouter = createTRPCRouter({
  create: protectedOrgProcedure
    .input(createSubscriptionSchema)
    .mutation(async (opts) => {
      const { planVersion, userId, projectSlug, planId } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const userHasActiveSubscription =
        await opts.ctx.db.query.subscription.findFirst({
          columns: {
            id: true,
          },
          with: {
            plan: {
              columns: {
                slug: true,
              },
            },
            version: {
              columns: {
                version: true,
              },
            },
          },
          where(fields, operators) {
            return operators.and(
              operators.eq(fields.userId, userId),
              operators.eq(fields.projectId, project.id),
              operators.eq(fields.status, "active")
            )
          },
        })

      if (userHasActiveSubscription) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `User already subscribed to plan: ${userHasActiveSubscription.plan.slug} version: ${userHasActiveSubscription.version.version}`,
        })
      }

      const versionData = await opts.ctx.db.query.version.findFirst({
        where(fields, operators) {
          return operators.and(
            operators.eq(fields.id, planVersion),
            operators.eq(fields.planId, planId),
            operators.eq(fields.projectId, project.id)
          )
        },
      })

      if (!versionData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Version not found",
        })
      }

      const subscriptionId = utils.newIdEdge("subscription")

      const subscriptionData = await opts.ctx.db
        .insert(schema.subscription)
        .values({
          id: subscriptionId,
          projectId: project.id,
          tenantId: opts.ctx.tenantId,
          planVersion: versionData.id,
          planId: versionData.planId,
          userId,
          status: "active",
        })
        .returning()

      return subscriptionData[0]
    }),
  createUser: protectedOrgProcedure
    .input(createUserSchema)
    .mutation(async (opts) => {
      const { projectSlug, email, name } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const userId = utils.newIdEdge("user")

      const userData = await opts.ctx.db
        .insert(schema.user)
        .values({
          id: userId,
          projectId: project.id,
          tenantId: opts.ctx.tenantId,
          name,
          email,
        })
        .returning()

      return userData[0]
    }),

  listUsersByProject: protectedOrgProcedure
    .input(z.object({ projectSlug: z.string() }))
    .query(async (opts) => {
      const { projectSlug } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const users = await opts.ctx.txRLS(({ txRLS }) =>
        txRLS.query.user.findMany({
          where: (user, { eq }) => eq(user.projectId, project.id),
        })
      )

      return {
        users: users,
      }
    }),
})
