import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { and, eq } from "@builderai/db"
import {
  createPlanSchema,
  plan,
  updatePlanSchema,
} from "@builderai/db/schema/price"
import { newIdEdge } from "@builderai/db/utils"

import {
  createTRPCRouter,
  protectedOrgProcedure,
  publicProcedure,
} from "../../trpc"
import { hasAccessToProject } from "../../utils"

export const planRouter = createTRPCRouter({
  create: protectedOrgProcedure
    .input(createPlanSchema)
    .mutation(async (opts) => {
      const { projectSlug, slug, title, currency } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const planId = newIdEdge("plan")

      const planData = await opts.ctx.db
        .insert(plan)
        .values({
          id: planId,
          slug,
          title,
          currency,
          projectId: project.id,
          tenantId: opts.ctx.tenantId,
        })
        .returning()

      return planData[0]
    }),
  update: protectedOrgProcedure
    .input(updatePlanSchema)
    .mutation(async (opts) => {
      const { title, id } = opts.input

      const planData = await opts.ctx.txRLS(({ txRLS }) => {
        return txRLS.query.plan.findFirst({
          with: {
            project: {
              columns: {
                slug: true,
              },
            },
          },
          where: (plan, { eq }) => eq(plan.id, id),
        })
      })

      if (!planData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "plan not found",
        })
      }

      const { project } = await hasAccessToProject({
        projectId: planData.projectId,
        ctx: opts.ctx,
      })

      return await opts.ctx.db
        .update(plan)
        .set({
          title,
        })
        .where(and(eq(plan.id, id), eq(plan.projectId, project.id)))
        .returning()
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async (opts) => {
      const { id } = opts.input

      return await opts.ctx.txRLS(({ txRLS }) => {
        return txRLS.query.plan.findFirst({
          with: {
            project: {
              columns: {
                slug: true,
              },
            },
          },
          where: (plan, { eq }) => eq(plan.id, id),
        })
      })
    }),

  listByProject: protectedOrgProcedure
    .input(z.object({ projectSlug: z.string() }))
    .query(async (opts) => {
      const { projectSlug } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const plans = await opts.ctx.txRLS(({ txRLS }) =>
        txRLS.query.plan.findMany({
          where: (plan, { eq }) => eq(plan.projectId, project.id),
        })
      )

      // FIXME: Don't hardcode the limit to PRO
      return {
        plans,
        limit: 3,
        limitReached: false,
      }
    }),
})
