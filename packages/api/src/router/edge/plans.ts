import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { and, eq, getTableColumns, schema, utils } from "@builderai/db"
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
  protectedProjectAdminProcedure,
  protectedProjectProcedure,
} from "../../trpc"

export const planRouter = createTRPCRouter({
  create: protectedProjectProcedure
    .input(createPlanSchema)
    .output(
      z.object({
        plan: planSelectBaseSchema.optional(),
      })
    )
    .mutation(async (opts) => {
      const { slug, title, currency } = opts.input
      const project = opts.ctx.project

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
        .then((planData) => {
          return planData[0]
        })

      return {
        plan: planData,
      }
    }),
  createNewVersion: protectedProjectAdminProcedure
    .input(createNewVersionPlan)
    .output(
      z.object({
        planVersion: versionSelectBaseSchema,
      })
    )
    .mutation(async (opts) => {
      const { planId } = opts.input
      const project = opts.ctx.project
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
        .then((re) => re[0] ?? undefined)

      if (!planVersionData?.id) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "error creating version",
        })
      }

      return {
        planVersion: planVersionData,
      }
    }),
  update: protectedProjectAdminProcedure
    .input(updatePlanSchema)
    .output(
      z.object({
        plan: planSelectBaseSchema.optional(),
      })
    )
    .mutation(async (opts) => {
      const { title, id } = opts.input
      const project = opts.ctx.project

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
        .then((re) => re[0] ?? undefined)

      return {
        plan: updatedPlan,
      }
    }),

  updateVersion: protectedProjectAdminProcedure
    .input(updateVersionPlan)
    .output(
      z.object({
        planVersion: versionSelectBaseSchema.optional(),
      })
    )
    .mutation(async (opts) => {
      const { planId, versionId, featuresConfig, addonsConfig, status } =
        opts.input

      const project = opts.ctx.project
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
        .then((re) => re[0] ?? undefined)

      return {
        planVersion: versionUpdated,
      }
    }),

  getVersionById: protectedProjectProcedure
    .input(
      z.object({
        planSlug: z.string(),
        versionId: z.coerce.number().min(0),
      })
    )
    .output(
      z.object({
        planVersion: versionSelectBaseSchema
          .extend({
            plan: planSelectBaseSchema.pick({
              slug: true,
              id: true,
            }),
          })
          .optional(),
      })
    )
    .query(async (opts) => {
      const { planSlug, versionId } = opts.input
      const project = opts.ctx.project

      const { ...rest } = getTableColumns(schema.versions)

      // TODO: improve this query
      const planVersionData = await opts.ctx.db
        .select({
          ...rest,
          plan: {
            slug: schema.plans.slug,
            id: schema.plans.id,
          },
        })
        .from(schema.versions)
        .limit(1)
        .innerJoin(schema.plans, eq(schema.versions.planId, schema.plans.id))
        .where(
          and(
            eq(schema.versions.version, versionId),
            eq(schema.plans.slug, planSlug),
            eq(schema.versions.projectId, project.id)
          )
        )
        .then((re) => re[0] ?? undefined)

      return {
        planVersion: planVersionData,
      }
    }),
  getBySlug: protectedProjectProcedure
    .input(z.object({ slug: z.string() }))
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
      const { slug } = opts.input
      const project = opts.ctx.project

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
          and(eq(plan.slug, slug), eq(plan.projectId, project.id)),
      })

      return {
        plan: plan,
      }
    }),

  getById: protectedProjectProcedure
    .input(z.object({ id: z.string() }))
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
      const { id } = opts.input
      const project = opts.ctx.project

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
        plan: plan,
      }
    }),

  listByProject: protectedProjectProcedure
    .input(
      z.object({
        fromDate: z.number().optional(),
        toDate: z.number().optional(),
      })
    )
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
      })
    )
    .query(async (opts) => {
      const { fromDate, toDate } = opts.input
      const project = opts.ctx.project

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
        where: (plan, { eq, and, between, gte, lte }) =>
          and(
            eq(plan.projectId, project.id),
            fromDate && toDate
              ? between(plan.createdAt, new Date(fromDate), new Date(toDate))
              : undefined,
            fromDate ? gte(plan.createdAt, new Date(fromDate)) : undefined,
            toDate ? lte(plan.createdAt, new Date(toDate)) : undefined
          ),
      })

      return {
        plans,
      }
    }),
})
