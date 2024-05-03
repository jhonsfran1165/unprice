import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { and, eq, getTableColumns, sql } from "@builderai/db"
import * as schema from "@builderai/db/schema"
import * as utils from "@builderai/db/utils"
import {
  planSelectBaseSchema,
  versionInsertBaseSchema,
  versionSelectBaseSchema,
} from "@builderai/db/validators"
import { stripe } from "@builderai/stripe"

import {
  createTRPCRouter,
  protectedActiveProjectAdminProcedure,
  protectedActiveProjectProcedure,
} from "../../trpc"

export const planVersionRouter = createTRPCRouter({
  create: protectedActiveProjectAdminProcedure
    .input(versionInsertBaseSchema)
    .output(
      z.object({
        planVersion: versionSelectBaseSchema,
      })
    )
    .mutation(async (opts) => {
      const {
        planId,
        featuresConfig,
        description,
        currency,
        billingPeriod,
        startCycle,
        gracePeriod,
        title,
        tags,
        whenToBill,
        status,
      } = opts.input
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

      // if plan is recurring, then billing period is required
      if (planData.type === "recurring" && !billingPeriod) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "billingPeriod is required for recurring plans",
        })
      }

      const planVersionId = utils.newId("plan_version")

      // this should happen in a transaction because we need to change the status of the previous version
      const planVersionData = await opts.ctx.db.transaction(async (tx) => {
        try {
          // count how many versions are there for the plan
          const countVersionsPlan = await opts.ctx.db
            .select({ count: sql<number>`count(*)` })
            .from(schema.versions)
            .where(
              and(
                eq(schema.versions.projectId, project.id),
                eq(schema.versions.planId, planId),
                eq(schema.versions.currency, currency)
              )
            )
            .then((res) => res[0]?.count ?? 0)

          // set the latest version to false if there is a latest version
          await tx
            .update(schema.versions)
            .set({
              latest: false,
            })
            .where(
              and(
                eq(schema.versions.projectId, project.id),
                eq(schema.versions.latest, true),
                eq(schema.versions.planId, planId),
                eq(schema.versions.currency, currency)
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
              status: status ?? "draft",
              version: countVersionsPlan + 1,
              latest: true,
              featuresConfig: featuresConfig ?? [],
              title: title ?? planData.slug,
              description,
              currency,
              billingPeriod: billingPeriod ?? "month",
              startCycle: startCycle ?? null,
              gracePeriod: gracePeriod ?? 0,
              whenToBill: whenToBill ?? "pay_in_advance",
              tags: tags ?? [],
            })
            .returning()
            .catch((err) => {
              console.error(err)
              tx.rollback()
              throw err
            })
            .then((re) => re[0])

          if (!planVersionData?.id) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "error creating version",
            })
          }

          return planVersionData
        } catch (error) {
          if (error instanceof Error) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: error.message,
            })
          } else {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "error creating version",
            })
          }
        }
      })

      return {
        planVersion: planVersionData,
      }
    }),

  remove: protectedActiveProjectAdminProcedure
    .input(
      versionInsertBaseSchema
        .pick({
          id: true,
        })
        .required({ id: true })
    )
    .output(z.object({ plan: versionSelectBaseSchema }))
    .mutation(async (opts) => {
      const { id } = opts.input
      const project = opts.ctx.project

      const planVersionData = await opts.ctx.db.query.versions.findFirst({
        where: (version, { and, eq }) =>
          and(eq(version.id, id), eq(version.projectId, project.id)),
      })

      if (!planVersionData?.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "version not found",
        })
      }

      // TODO: should we allow to delete a published version when there is no subscription?
      if (planVersionData?.status === "published") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Cannot delete a published version, deactivate it instead",
        })
      }

      const deletedPlanVersion = await opts.ctx.db
        .delete(schema.versions)
        .where(
          and(
            eq(schema.versions.projectId, project.id),
            eq(schema.versions.id, planVersionData.id)
          )
        )
        .returning()
        .then((data) => data[0])

      if (!deletedPlanVersion?.id) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error deleting feature",
        })
      }

      return {
        plan: deletedPlanVersion,
      }
    }),
  update: protectedActiveProjectAdminProcedure
    .input(
      versionInsertBaseSchema
        .partial({
          projectId: true,
          title: true,
          currency: true,
          planId: true,
        })
        .required({ id: true })
    )
    .output(
      z.object({
        planVersion: versionSelectBaseSchema,
      })
    )
    .mutation(async (opts) => {
      const {
        featuresConfig,
        status,
        id,
        description,
        currency,
        billingPeriod,
        startCycle,
        gracePeriod,
        title,
        tags,
        whenToBill,
      } = opts.input

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
          and(eq(version.id, id), eq(version.projectId, project.id)),
      })

      if (!planVersionData?.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "version not found",
        })
      }

      // TODO: actually a user can update some fields of the version
      if (planVersionData.status === "published") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot update a published version, read only",
        })
      }

      // replace lastUnit Inifinity with string "Infinity" -> if infinity is passed as a number it will be converted to null
      const config = featuresConfig?.map((feature) => {
        const { config } = feature
        if (config?.tiers) {
          config.tiers = config.tiers.map((tier) => {
            if (tier.lastUnit === Infinity) {
              return {
                ...tier,
                lastUnit: "Infinity",
              }
            }
            return tier
          })
        }
        return feature
      })

      const versionUpdated = await opts.ctx.db
        .update(schema.versions)
        .set({
          ...(description && { description }),
          ...(currency && { currency }),
          ...(billingPeriod && { billingPeriod }),
          ...(startCycle && { startCycle }),
          ...(gracePeriod && { gracePeriod }),
          ...(title && { title }),
          ...(tags && { tags }),
          ...(whenToBill && { whenToBill }),
          ...(status && { status }),
          ...(featuresConfig && { featuresConfig: config }),
          updatedAt: new Date(),
        })
        .where(and(eq(schema.versions.id, planVersionData.id)))
        .returning()
        .then((re) => re[0])

      if (!versionUpdated) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error updating version",
        })
      }

      return {
        planVersion: versionUpdated,
      }
    }),

  getByVersion: protectedActiveProjectProcedure
    .input(
      z.object({
        planSlug: z.string(),
        version: z.coerce.number().min(0),
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
      const { planSlug, version } = opts.input
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
            eq(schema.versions.version, version),
            eq(schema.plans.slug, planSlug),
            eq(schema.versions.projectId, project.id)
          )
        )
        .then((re) => re[0])

      if (!planVersionData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Plan version not found",
        })
      }

      return {
        planVersion: planVersionData,
      }
    }),
  // TODO: change this for syncWithPaymentProvider
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
      const features = planVersion.featuresConfig

      console.log("features", features)

      // calculate the price of flat features and that would be the base price of the plan
      const basePricePlan = features.reduce((acc, feature) => {
        if (feature.type === "flat") {
          return acc + feature.config.price
        }
        return acc
      }, 0)

      console.log("basePricePlan", basePricePlan)

      // create a product for the plan
      // limit 15 flat features
      const flatProductStripe = await stripe.products.create(
        {
          name: `${planVersion.plan.slug} - flat`,
          type: "service",
          description: planVersion.plan.description ?? "dasdasd",
          features: features.map((feature) => ({
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
          currency: planVersion.currency ?? "usd",
          product: flatProductStripe.id,
          unit_amount: basePricePlan * 100,
          recurring: {
            interval: planVersion.billingPeriod ?? "month",
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
