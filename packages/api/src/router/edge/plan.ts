import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { and, eq, schema, utils } from "@builderai/db"
import {
  createNewVersionPlan,
  createPlanSchema,
  planSelectBaseSchema,
  updatePlanSchema,
  updateVersionPlan,
  versionSelectBaseSchema,
} from "@builderai/validators/price"

import {
  createTRPCRouter,
  protectedOrgProcedure,
  publicProcedure,
} from "../../trpc"
import { hasAccessToProject } from "../../utils"

export const planRouter = createTRPCRouter({
  create: protectedOrgProcedure
    .input(createPlanSchema)
    .output(
      z.object({
        plan: planSelectBaseSchema.optional(),
      })
    )
    .mutation(async (opts) => {
      const { projectSlug, slug, title, currency } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const planId = utils.newIdEdge("plan")

      const planData = await opts.ctx.db
        .insert(schema.plans)
        .values({
          id: planId,
          slug,
          title,
          currency,
          projectId: project.id,
        })
        .returning()

      return {
        plan: planData[0],
      }
    }),
  createNewVersion: protectedOrgProcedure
    .input(createNewVersionPlan)
    .output(
      z.object({
        planVersion: versionSelectBaseSchema.optional(),
      })
    )
    .mutation(async (opts) => {
      const { projectSlug, planId } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const planVersionId = utils.newIdEdge("plan_version")

      const planData = await opts.ctx.db.query.plans.findFirst({
        where: (plan, { eq, and }) =>
          and(eq(plan.id, planId), eq(plan.projectId, project.id)),
      })

      if (!planData?.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "plan not found",
        })
      }

      // version is a incrementing number calculated on save time by the database
      const planVersionData = await opts.ctx.db
        .insert(schema.versions)
        .values({
          id: planVersionId,
          planId,
          projectId: project.id,
          status: "draft",
        })
        .returning()

      return {
        planVersion: planVersionData[0],
      }
    }),
  update: protectedOrgProcedure
    .input(updatePlanSchema)
    .output(
      z.object({
        plan: planSelectBaseSchema.optional(),
      })
    )
    .mutation(async (opts) => {
      const { title, id, projectSlug } = opts.input

      const { project } = await hasAccessToProject({
        projectId: projectSlug,
        ctx: opts.ctx,
      })

      const planData = await opts.ctx.db.query.plans.findFirst({
        with: {
          project: {
            columns: {
              slug: true,
            },
          },
        },
        where: (plan, { eq, and }) =>
          and(eq(plan.id, id), eq(plan.projectId, project.id)),
      })

      if (!planData?.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "plan not found",
        })
      }

      const updatedPlan = await opts.ctx.db
        .update(schema.plans)
        .set({
          title,
          updatedAt: new Date(),
        })
        .where(
          and(eq(schema.plans.id, id), eq(schema.plans.projectId, project.id))
        )
        .returning()

      return {
        plan: updatedPlan[0],
      }
    }),

  updateVersion: publicProcedure
    .input(updateVersionPlan)
    .output(
      z.object({
        planVersion: versionSelectBaseSchema.optional(),
      })
    )
    .mutation(async (opts) => {
      const {
        planId,
        projectSlug,
        versionId,
        featuresConfig,
        addonsConfig,
        status,
      } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const planVersionData = await opts.ctx.db.query.versions.findFirst({
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

      if (!planVersionData?.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "version not found",
        })
      }

      const versionUpdated = await opts.ctx.db
        .update(schema.versions)
        .set({
          featuresConfig,
          addonsConfig,
          status,
          updatedAt: new Date(),
        })
        .where(and(eq(schema.versions.id, planVersionData.id)))
        .returning()

      return {
        planVersion: versionUpdated[0],
      }
    }),

  getVersionById: publicProcedure
    .input(
      z.object({
        planId: z.string(),
        versionId: z.coerce.number().min(0),
        projectSlug: z.string(),
      })
    )
    .output(
      z.object({
        planVersion: versionSelectBaseSchema.optional(),
      })
    )
    .query(async (opts) => {
      const { planId, projectSlug, versionId } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const planVersionData = await opts.ctx.db.query.versions.findFirst({
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

      return {
        planVersion: planVersionData,
      }
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string(), projectSlug: z.string() }))
    .output(
      z.object({
        plan: planSelectBaseSchema
          .extend({
            versions: z.array(
              versionSelectBaseSchema.pick({
                id: true,
                status: true,
                version: true,
              })
            ),
            project: z.object({
              slug: z.string(),
            }),
          })
          .optional(),
      })
    )
    .query(async (opts) => {
      const { id, projectSlug } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const plan = await opts.ctx.db.query.plans.findFirst({
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
        where: (plan, { eq, and }) =>
          and(eq(plan.id, id), eq(plan.projectId, project.id)),
      })

      return {
        plan,
      }
    }),

  listByProject: protectedOrgProcedure
    .input(z.object({ projectSlug: z.string() }))
    .output(
      z.object({
        plans: z.array(
          planSelectBaseSchema.extend({
            versions: z.array(
              versionSelectBaseSchema.pick({
                id: true,
                status: true,
                version: true,
              })
            ),
          })
        ),
        limit: z.number(),
        limitReached: z.boolean(),
      })
    )
    .query(async (opts) => {
      const { projectSlug } = opts.input

      const { project } = await hasAccessToProject({
        projectSlug,
        ctx: opts.ctx,
      })

      const plans = await opts.ctx.db.query.plans.findMany({
        with: {
          versions: {
            orderBy: (version, { desc }) => [desc(version.createdAt)],
            columns: {
              version: true,
              status: true,
              id: true,
            },
          },
        },
        where: (plan, { eq }) => eq(plan.projectId, project.id),
      })

      // FIXME: Don't hardcode the limit to PRO
      return {
        plans,
        limit: 3,
        limitReached: false,
      }
    }),
})
