import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { and, eq } from "@builderai/db"
import {
  createNewVersionPlan,
  createPlanSchema,
  plan,
  updatePlanSchema,
  updateVersionPlan,
  versionBase,
} from "@builderai/db/schema/price"
import { newIdEdge } from "@builderai/db/utils"

import {
  createTRPCRouter,
  protectedOrgProcedure,
  publicProcedure,
} from "../../trpc"
import { hasAccessToProject } from "../../utils"
import { version } from "./../../../../db/src/schema/price/price.sql"

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
  createNewVersion: protectedOrgProcedure
    .input(createNewVersionPlan)
    .mutation(async (opts) => {
      const { projectSlug, planId } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const planVersionId = newIdEdge("plan_version")

      const planData = await opts.ctx.db
        .select()
        .from(plan)
        .where(and(eq(plan.id, planId), eq(plan.projectId, project.id)))

      if (!planData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "plan not found",
        })
      }

      // version is a incrementing number calculated on save time by the database
      const planVersionData = await opts.ctx.db
        .insert(version)
        .values({
          id: planVersionId,
          planId,
          projectId: project.id,
          tenantId: opts.ctx.tenantId,
          addonsPlan: {},
          featuresPlan: {},
          status: "draft",
        })
        .returning()

      return planVersionData[0]
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

  updateVersion: publicProcedure
    .input(updateVersionPlan)
    .mutation(async (opts) => {
      const {
        planId,
        projectSlug,
        versionId,
        featuresPlan,
        addonsPlan,
        status,
      } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const planVersionData = await opts.ctx.txRLS(({ txRLS }) => {
        return txRLS.query.version.findFirst({
          with: {
            plan: {
              columns: {
                slug: true,
              },
            },
          },
          where: (version, { and, eq }) =>
            and(
              eq(version.version, versionId),
              eq(version.planId, planId),
              eq(version.projectId, project.id)
            ),
        })
      })

      if (!planVersionData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "version not found",
        })
      }

      const versionUpdated = await opts.ctx.db
        .update(version)
        .set({
          featuresPlan,
          addonsPlan,
          status,
        })
        .where(and(eq(version.id, planVersionData.id)))
        .returning()

      return versionBase.parse(versionUpdated[0])
    }),

  getVersionById: publicProcedure
    .input(
      z.object({
        planId: z.string(),
        versionId: z.coerce.number().min(0),
        projectSlug: z.string(),
      })
    )
    .query(async (opts) => {
      const { planId, projectSlug, versionId } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const planVersionData = await opts.ctx.txRLS(({ txRLS }) => {
        return txRLS.query.version.findFirst({
          with: {
            plan: {
              columns: {
                slug: true,
              },
            },
          },
          where: (version, { and, eq }) =>
            and(
              eq(version.version, versionId),
              eq(version.planId, planId),
              eq(version.projectId, project.id)
            ),
        })
      })

      return versionBase.parse(planVersionData)
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async (opts) => {
      const { id } = opts.input

      return await opts.ctx.txRLS(({ txRLS }) => {
        return txRLS.query.plan.findFirst({
          with: {
            versions: {
              orderBy: (version, { desc }) => [desc(version.createdAt)],
              columns: {
                version: true,
                status: true,
                id: true,
              },
            },
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
          with: {
            versions: {
              orderBy: (version, { desc }) => [desc(version.createdAt)],
              columns: {
                version: true,
                status: true,
              },
            },
          },
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
