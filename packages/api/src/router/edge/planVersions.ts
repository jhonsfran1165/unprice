import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { and, eq, getTableColumns } from "@builderai/db"
import * as schema from "@builderai/db/schema"
import * as utils from "@builderai/db/utils"
import type { PlanVersionFeature } from "@builderai/db/validators"
import {
  insertPlanSchema,
  planSelectBaseSchema,
  updateVersionPlan,
  versionInsertBaseSchema,
  versionSelectBaseSchema,
} from "@builderai/db/validators"
import { stripe } from "@builderai/stripe"

import {
  createTRPCRouter,
  protectedActiveProjectAdminProcedure,
  protectedActiveProjectProcedure,
} from "../../trpc"

export const planRouter = createTRPCRouter({
  create: protectedActiveProjectProcedure
    .input(insertPlanSchema)
    .output(
      z.object({
        plan: planSelectBaseSchema,
      })
    )
    .mutation(async (opts) => {
      const { slug, paymentProvider, description, type } = opts.input
      const project = opts.ctx.project

      const planId = utils.newId("plan")

      const planData = await opts.ctx.db
        .insert(schema.plans)
        .values({
          id: planId,
          slug,
          paymentProvider,
          projectId: project.id,
          description,
          type,
          active: true,
        })
        .returning()
        .then((planData) => {
          return planData[0]
        })

      if (!planData?.id) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "error creating plan",
        })
      }

      return {
        plan: planData,
      }
    }),
  createVersion: protectedActiveProjectAdminProcedure
    .input(versionInsertBaseSchema.partial({ id: true, version: true }))
    .output(
      z.object({
        planVersion: versionSelectBaseSchema,
      })
    )
    .mutation(async (opts) => {
      const { planId, featuresConfig } = opts.input
      const project = opts.ctx.project

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

      const planVersionId = utils.newId("plan_version")

      // this should happen in a transaction
      const planVersionData = await opts.ctx.db.transaction(async (tx) => {
        try {
          // change status of previous latest version.
          const latestVersion = await tx
            .update(schema.versions)
            .set({
              latest: false,
            })
            .where(
              and(
                eq(schema.versions.projectId, project.id),
                eq(schema.versions.latest, true)
              )
            )
            .returning()
            .then((re) => re[0])

          // version is a incrementing number calculated on save time by the database
          const planVersionData = await tx
            .insert(schema.versions)
            .values({
              id: planVersionId,
              planId,
              projectId: project.id,
              status: "draft",
              latest: true,
              version: latestVersion?.version ? latestVersion?.version + 1 : 1,
              featuresConfig,
              // TODO: fix this
              title: "draft version",
            })
            .returning()
            .then((re) => re[0])

          if (!planVersionData?.id) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "error creating version",
            })
          }

          return planVersionData
        } catch (error) {
          tx.rollback()
          throw error
        }
      })

      return {
        planVersion: planVersionData,
      }
    }),

  remove: protectedActiveProjectProcedure
    .input(planSelectBaseSchema.pick({ id: true }))
    .output(z.object({ plan: planSelectBaseSchema }))
    .mutation(async (opts) => {
      const { id } = opts.input
      const project = opts.ctx.project

      const versions = await opts.ctx.db.query.versions.findMany({
        columns: {
          id: true,
        },
        where: (version, { eq }) => eq(version.planId, id),
      })

      if (versions.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "You cannot delete a plan that has versions. Please deactivate it instead",
        })
      }

      const deletedPlan = await opts.ctx.db
        .delete(schema.plans)
        .where(
          and(eq(schema.plans.projectId, project.id), eq(schema.plans.id, id))
        )
        .returning()
        .then((data) => data[0])

      if (!deletedPlan) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error deleting feature",
        })
      }

      return {
        plan: deletedPlan,
      }
    }),
  update: protectedActiveProjectAdminProcedure
    .input(
      insertPlanSchema.required({
        id: true,
      })
    )
    .output(
      z.object({
        plan: planSelectBaseSchema.optional(),
      })
    )
    .mutation(async (opts) => {
      const {
        id,
        title,
        currency,
        billingPeriod,
        startCycle,
        description,
        type,
      } = opts.input
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
          currency,
          billingPeriod,
          startCycle: startCycle ?? null,
          description,
          type,
          updatedAt: new Date(),
        })
        .where(
          and(eq(schema.plans.id, id), eq(schema.plans.projectId, project.id))
        )
        .returning()
        .then((re) => re[0])

      return {
        plan: updatedPlan,
      }
    }),

  updateVersion: protectedActiveProjectAdminProcedure
    .input(updateVersionPlan)
    .output(
      z.object({
        planVersion: versionSelectBaseSchema.optional(),
      })
    )
    .mutation(async (opts) => {
      const { planId, versionId, featuresConfig, status } = opts.input

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

      if (planVersionData.status === "published") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot update a published version",
        })
      }

      const versionUpdated = await opts.ctx.db
        .update(schema.versions)
        .set({
          featuresConfig,
          status,
          updatedAt: new Date(),
        })
        .where(and(eq(schema.versions.id, planVersionData.id)))
        .returning()
        .then((re) => re[0])

      return {
        planVersion: versionUpdated,
      }
    }),

  getVersionById: protectedActiveProjectProcedure
    .input(
      z.object({
        planSlug: z.string(),
        versionId: z.coerce.number().min(0),
      })
    )
    .output(
      z.object({
        planVersion: versionSelectBaseSchema.extend({
          plan: planSelectBaseSchema.pick({
            slug: true,
            id: true,
          }),
        }),
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
  exist: protectedActiveProjectProcedure
    .input(z.object({ slug: z.string() }))
    .output(
      z.object({
        exist: z.boolean(),
      })
    )
    .mutation(async (opts) => {
      const { slug } = opts.input
      const project = opts.ctx.project

      const plan = await opts.ctx.db.query.plans.findFirst({
        columns: {
          id: true,
        },
        where: (plan, { eq, and }) =>
          and(eq(plan.projectId, project.id), eq(plan.slug, slug)),
      })

      return {
        exist: !!plan,
      }
    }),
  getBySlug: protectedActiveProjectProcedure
    .input(z.object({ slug: z.string() }))
    .output(
      z.object({
        plan: planSelectBaseSchema.extend({
          versions: z.array(
            versionSelectBaseSchema.pick({
              id: true,
              status: true,
              version: true,
              latest: true,
              title: true,
              tags: true,
              description: true,
              currency: true,
              createdAt: true,
            })
          ),
          project: z.object({
            slug: z.string(),
          }),
        }),
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
              id: true,
              status: true,
              version: true,
              latest: true,
              title: true,
              tags: true,
              description: true,
              currency: true,
              createdAt: true,
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

      // TODO: return 403 on all queries that return null
      if (!plan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Plan not found",
        })
      }

      return {
        plan: plan,
      }
    }),

  getById: protectedActiveProjectProcedure
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

  listByActiveProject: protectedActiveProjectProcedure
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
  syncWithStripe: protectedActiveProjectProcedure
    .input(
      z.object({
        planId: z.string(),
        planVersionId: z.number(),
      })
    )
    .output(z.object({ success: z.boolean() }))
    .mutation(async (opts) => {
      const project = opts.ctx.project

      const planVersion = await opts.ctx.db.query.versions.findFirst({
        with: {
          plan: true,
        },
        where: (version, { and, eq }) =>
          and(
            eq(version.projectId, project.id),
            eq(version.status, "published"),
            eq(version.version, opts.input.planVersionId)
          ),
      })

      if (!planVersion?.featuresConfig) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Plan version has no features to sync",
        })
      }

      // add custom id of the product
      // search for prices of the product to check if they need to be updated
      // or created

      // limits of products is important here

      // group all features by type
      const features = planVersion.featuresConfig.reduce(
        (acc, feature) => {
          if (!acc[feature.type]) {
            acc[feature.type] = []
          }

          acc[feature.type]?.push(feature)

          return acc
        },
        {} as Record<schema.FeatureType, PlanVersionFeature[]>
      )

      console.log("features", features)

      // calculate the price of flat features and that would be the base price of the plan
      const basePricePlan = features.flat.reduce((acc, feature) => {
        return acc + feature.config?.price
      }, 0)

      console.log("basePricePlan", basePricePlan)

      // create a product for the plan
      // limit 15 flat features
      const flatProductStripe = await stripe.products.create(
        {
          name: `${planVersion.plan.slug} - flat`,
          type: "service",
          description: planVersion.plan.description ?? "dasdasd",
          features: features.flat.map((feature) => ({
            name: feature.title,
          })),
          metadata: {
            planId: planVersion.plan.id,
            planVersionId: planVersion.id,
          },
        },
        {
          stripeAccount: project.stripeAccountId ?? "",
        }
      )

      // TODO
      // get the product and price id
      // save the prices ids in the plan version

      // create a price for the product
      const flatPriceStripe = await stripe.prices.create(
        {
          currency: planVersion.plan.currency ?? "usd",
          product: flatProductStripe.id,
          unit_amount: basePricePlan * 100,
          recurring: {
            interval: planVersion.plan.billingPeriod ?? "month",
          },
          metadata: {
            planId: planVersion.plan.id,
            planVersionId: planVersion.id,
          },
          lookup_key: `${planVersion.plan.slug}-flat`,
        },
        {
          stripeAccount: project.stripeAccountId ?? "",
        }
      )

      // update the plan with the price id
      console.log("flatPriceStripe", flatPriceStripe)

      return {
        success: true,
      }
    }),
})
