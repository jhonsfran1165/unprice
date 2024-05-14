import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { and, eq } from "@builderai/db"
import * as schema from "@builderai/db/schema"
import * as utils from "@builderai/db/utils"
import {
  featureSelectBaseSchema,
  planSelectBaseSchema,
  planVersionFeatureSelectBaseSchema,
  planVersionSelectBaseSchema,
  versionInsertBaseSchema,
} from "@builderai/db/validators"

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
        planVersion: planVersionSelectBaseSchema,
      })
    )
    .mutation(async (opts) => {
      const {
        planId,
        metadata,
        description,
        currency,
        billingPeriod,
        startCycle,
        gracePeriod,
        title,
        tags,
        whenToBill,
        status,
        paymentProvider,
        planType,
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

      const planVersionId = utils.newId("plan_version")

      // this should happen in a transaction because we need to change the status of the previous version
      const planVersionData = await opts.ctx.db.transaction(async (tx) => {
        try {
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
                eq(schema.versions.planId, planId)
              )
            )
            .returning()
            .then((re) => re[0])

          const planVersionData = await tx
            .insert(schema.versions)
            .values({
              id: planVersionId,
              planId,
              projectId: project.id,
              description,
              title: title ?? planData.slug,
              tags: tags ?? [],

              status: status ?? "draft",
              paymentProvider,
              planType,
              // TODO: is latest really necessary?
              latest: true,
              currency,
              billingPeriod: billingPeriod ?? "month",
              startCycle: startCycle ?? null,
              gracePeriod: gracePeriod ?? 0,
              whenToBill: whenToBill ?? "pay_in_advance",
              metadata,
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
      planVersionSelectBaseSchema
        .pick({
          id: true,
        })
        .required({ id: true })
    )
    .output(z.object({ plan: planVersionSelectBaseSchema }))
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
    .input(planVersionSelectBaseSchema.partial().required({ id: true }))
    .output(
      z.object({
        planVersion: planVersionSelectBaseSchema,
      })
    )
    .mutation(async (opts) => {
      const {
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
        paymentProvider,
        metadata,
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
          ...(metadata && { metadata }),
          ...(paymentProvider && { paymentProvider }),
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
  duplicate: protectedActiveProjectAdminProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .output(
      z.object({
        planVersion: planVersionSelectBaseSchema,
      })
    )
    .mutation(async (opts) => {
      const { id } = opts.input
      const project = opts.ctx.project

      const planVersionData = await opts.ctx.db.query.versions.findFirst({
        where: (version, { and, eq }) =>
          and(eq(version.id, id), eq(version.projectId, project.id)),
        with: {
          planFeatures: true,
        },
      })

      if (!planVersionData?.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Plan version not found",
        })
      }

      const planVersionId = utils.newId("plan_version")

      // this should happen in a transaction because we need to create every feature version
      const duplicatedVersion = await opts.ctx.db.transaction(async (tx) => {
        try {
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
                eq(schema.versions.planId, planVersionData.planId)
              )
            )
            .returning()
            .then((re) => re[0])

          // duplicate the plan version
          const planVersionDataDuplicated = await tx
            .insert(schema.versions)
            .values({
              ...planVersionData,
              id: planVersionId,
              metadata: {},
              latest: true,
              status: "draft",
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning()
            .catch((err) => {
              console.error(err)
              tx.rollback()
              throw err
            })
            .then((re) => re[0])

          if (!planVersionDataDuplicated?.id) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "error creating version",
            })
          }

          // duplicate the plan version features
          await Promise.all(
            planVersionData.planFeatures.map(async (feature) => {
              const planVersionFeatureId = utils.newId("feature_version")

              try {
                await tx
                  .insert(schema.planVersionFeatures)
                  .values({
                    ...feature,
                    id: planVersionFeatureId,
                    planVersionId: planVersionId,
                    metadata: {},
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  })
                  .returning()
              } catch (err) {
                console.error(err)
                tx.rollback()
                throw err
              }
            })
          )

          return planVersionDataDuplicated
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

      if (!duplicatedVersion) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error duplicating version",
        })
      }

      return {
        planVersion: duplicatedVersion,
      }
    }),

  publish: protectedActiveProjectAdminProcedure
    .input(planVersionSelectBaseSchema.partial().required({ id: true }))
    .output(
      z.object({
        planVersion: planVersionSelectBaseSchema,
      })
    )
    .mutation(async (opts) => {
      const { id } = opts.input

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

      // We don't need to sync with the payment provider because we only use it for
      // invoicing and not for subscriptions
      // await syncPaymentProvider({
      //   ctx: opts.ctx,
      //   planVersion: planVersionData,
      // })

      const versionUpdated = await opts.ctx.db
        .update(schema.versions)
        .set({
          status: "published",
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
  getById: protectedActiveProjectProcedure
    .input(
      z.object({
        planSlug: z.string(),
        id: z.string(),
      })
    )
    .output(
      z.object({
        planVersion: planVersionSelectBaseSchema.extend({
          plan: planSelectBaseSchema,
          planFeatures: z.array(
            planVersionFeatureSelectBaseSchema.extend({
              feature: featureSelectBaseSchema,
            })
          ),
        }),
      })
    )
    .query(async (opts) => {
      const { planSlug, id } = opts.input
      const project = opts.ctx.project

      const planData = await opts.ctx.db.query.plans.findFirst({
        where: (plan, { and, eq }) =>
          and(eq(plan.slug, planSlug), eq(plan.projectId, project.id)),
      })

      if (!planData?.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Plan not found",
        })
      }

      // TODO: improve this query
      const planVersionData = await opts.ctx.db.query.versions.findFirst({
        with: {
          plan: true,
          planFeatures: {
            with: {
              feature: true,
            },
            orderBy(fields, operators) {
              return operators.asc(fields.order)
            },
          },
        },
        where: (version, { and, eq }) =>
          and(
            eq(version.projectId, project.id),
            eq(version.id, id),
            eq(version.planId, planData.id)
          ),
      })

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
})
