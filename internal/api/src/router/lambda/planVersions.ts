import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { and, eq, sql } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import * as utils from "@unprice/db/utils"
import {
  calculateFlatPricePlan,
  configFlatSchema,
  configPackageSchema,
  configTierSchema,
  configUsageSchema,
  featureSelectBaseSchema,
  planSelectBaseSchema,
  planVersionFeatureSelectBaseSchema,
  planVersionSelectBaseSchema,
  versionInsertBaseSchema,
} from "@unprice/db/validators"
import { StripePaymentProvider } from "../../pkg/payment-provider/stripe"
import { createTRPCRouter, protectedProcedure, protectedProjectProcedure } from "../../trpc"

import { APP_NAME } from "@unprice/config"
import { isZero } from "dinero.js"

export const planVersionRouter = createTRPCRouter({
  create: protectedProjectProcedure
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

      // only owner and admin can create a plan version
      opts.ctx.verifyRole(["OWNER", "ADMIN"])

      const planData = await opts.ctx.db.query.plans.findFirst({
        where: (plan, { eq, and }) => and(eq(plan.id, planId), eq(plan.projectId, project.id)),
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
          // get the count of versions for this plan
          const countVersionsPlan = await tx
            .select({ count: sql<number>`count(*)` })
            .from(schema.versions)
            .where(
              and(eq(schema.versions.projectId, project.id), eq(schema.versions.planId, planId))
            )
            .then((res) => res[0]?.count ?? 0)

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
              currency,
              billingPeriod: billingPeriod ?? "month",
              startCycle: startCycle ?? "first_day_of_month",
              gracePeriod: gracePeriod ?? 0,
              whenToBill: whenToBill ?? "pay_in_advance",
              metadata,
              version: Number(countVersionsPlan) + 1,
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
          }
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "error creating version",
          })
        }
      })

      return {
        planVersion: planVersionData,
      }
    }),

  deactivate: protectedProjectProcedure
    .input(
      planVersionSelectBaseSchema
        .pick({
          id: true,
        })
        .required({ id: true })
    )
    .output(z.object({ planVersion: planVersionSelectBaseSchema }))
    .mutation(async (opts) => {
      const { id } = opts.input
      const project = opts.ctx.project

      // only owner and admin can deactivate a plan version
      opts.ctx.verifyRole(["OWNER", "ADMIN"])

      const planVersionData = await opts.ctx.db.query.versions.findFirst({
        where: (version, { and, eq }) => and(eq(version.id, id), eq(version.projectId, project.id)),
      })

      if (!planVersionData?.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "version not found",
        })
      }

      if (planVersionData?.status !== "published") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You can only deactivate a published version",
        })
      }

      if (!planVersionData.active) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Version is already deactivated",
        })
      }

      // if the current version is the latest, we need to deactivate it and set the latest to the previous version
      const deactivatedVersion = await opts.ctx.db.transaction(async (tx) => {
        try {
          let promise = undefined

          if (planVersionData.latest) {
            // get the previous latest published version
            const previousVersion = await tx.query.versions
              .findMany({
                where: (version, { and, eq }) =>
                  and(
                    eq(version.projectId, project.id),
                    eq(version.planId, planVersionData.planId),
                    eq(version.status, "published"),
                    eq(version.latest, false),
                    eq(version.active, true)
                  ),
                orderBy(fields, operators) {
                  // get the latest published version
                  return operators.desc(fields.publishedAt)
                },
              })
              .then((data) => data[0])

            if (previousVersion?.id) {
              promise = tx
                .update(schema.versions)
                .set({
                  latest: true,
                })
                .where(
                  and(
                    eq(schema.versions.projectId, project.id),
                    eq(schema.versions.id, previousVersion.id)
                  )
                )
            }
          }

          // deactivate the current version, change the latest to false and update the updatedAtM
          // if the current version is the latest, we need to deactivate it and set the latest to the previous version
          const [planVersionDataDuplicated] = await Promise.all([
            tx
              .update(schema.versions)
              .set({
                active: false,
                latest: false,
                updatedAtM: Date.now(),
              })
              .where(and(eq(schema.versions.id, planVersionData.id)))
              .returning()
              .then((data) => data[0]),
            // update the previous version to be the latest only if the current version is the latest
            promise,
          ])

          return planVersionDataDuplicated
        } catch (error) {
          if (error instanceof Error) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: error.message,
            })
          }
        }
      })

      if (!deactivatedVersion?.id) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error deactivating version",
        })
      }

      return {
        planVersion: deactivatedVersion,
      }
    }),

  remove: protectedProjectProcedure
    .input(
      planVersionSelectBaseSchema
        .pick({
          id: true,
        })
        .required({ id: true })
    )
    .output(z.object({ planVersion: planVersionSelectBaseSchema }))
    .mutation(async (opts) => {
      const { id } = opts.input
      const project = opts.ctx.project

      // only owner and admin can delete a plan version
      opts.ctx.verifyRole(["OWNER", "ADMIN"])

      const planVersionData = await opts.ctx.db.query.versions.findFirst({
        where: (version, { and, eq }) => and(eq(version.id, id), eq(version.projectId, project.id)),
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
          and(eq(schema.versions.projectId, project.id), eq(schema.versions.id, planVersionData.id))
        )
        .returning()
        .then((data) => data[0])

      if (!deletedPlanVersion?.id) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error deleting version",
        })
      }

      return {
        planVersion: deletedPlanVersion,
      }
    }),
  update: protectedProjectProcedure
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

      // only owner and admin can update a plan version
      opts.ctx.verifyRole(["OWNER", "ADMIN"])

      const planVersionData = await opts.ctx.db.query.versions.findFirst({
        with: {
          plan: {
            columns: {
              slug: true,
            },
          },
        },
        where: (version, { and, eq }) => and(eq(version.id, id), eq(version.projectId, project.id)),
      })

      if (!planVersionData?.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "version not found",
        })
      }

      if (planVersionData.status === "published") {
        // only allow to update the status && description
        const data = await opts.ctx.db
          .update(schema.versions)
          .set({
            ...(description && { description }),
            ...(status && { status }),
            updatedAtM: Date.now(),
          })
          .where(and(eq(schema.versions.id, planVersionData.id)))
          .returning()
          .then((re) => re[0])

        if (!data) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Error updating version",
          })
        }

        return {
          planVersion: data,
        }
      }

      // Very costly operation -- this only happens when the currency is updated and the plan is not published
      // if the user wants to update the currency, we have to go over all the features and update the currency
      const versionUpdated = await opts.ctx.db.transaction(async (tx) => {
        if (currency && currency !== planVersionData.currency) {
          await tx.query.planVersionFeatures
            .findMany({
              where: (feature, { and, eq }) =>
                and(
                  eq(feature.planVersionId, planVersionData.id),
                  eq(feature.projectId, project.id)
                ),
            })
            .then(async (features) => {
              await Promise.all(
                features.map(async (feature) => {
                  // here we have to take into account the feature type
                  switch (feature.featureType) {
                    case "flat": {
                      const config = configFlatSchema.parse(feature.config)

                      return await tx
                        .update(schema.planVersionFeatures)
                        .set({
                          config: {
                            ...config,
                            price: {
                              ...config.price,
                              dinero: {
                                ...config.price.dinero,
                                currency: {
                                  ...config.price.dinero.currency,
                                  code: currency,
                                },
                              },
                            },
                          },
                        })
                        .where(and(eq(schema.planVersionFeatures.id, feature.id)))
                    }

                    case "tier": {
                      const config = configTierSchema.parse(feature.config)

                      return await tx
                        .update(schema.planVersionFeatures)
                        .set({
                          config: {
                            ...config,
                            tiers: config.tiers.map((tier) => ({
                              ...tier,
                              unitPrice: {
                                ...tier.unitPrice,
                                dinero: {
                                  ...tier.unitPrice.dinero,
                                  currency: {
                                    ...tier.unitPrice.dinero.currency,
                                    code: currency,
                                  },
                                },
                              },
                              flatPrice: {
                                ...tier.flatPrice,
                                dinero: {
                                  ...tier.flatPrice.dinero,
                                  currency: {
                                    ...tier.flatPrice.dinero.currency,
                                    code: currency,
                                  },
                                },
                              },
                            })),
                          },
                        })
                        .where(and(eq(schema.planVersionFeatures.id, feature.id)))
                    }

                    case "usage": {
                      const config = configUsageSchema.parse(feature.config)

                      if (config.tiers && config.tiers.length > 0) {
                        return await tx
                          .update(schema.planVersionFeatures)
                          .set({
                            config: {
                              ...config,
                              tiers: config.tiers.map((tier) => ({
                                ...tier,
                                unitPrice: {
                                  ...tier.unitPrice,
                                  dinero: {
                                    ...tier.unitPrice.dinero,
                                    currency: {
                                      ...tier.unitPrice.dinero.currency,
                                      code: currency,
                                    },
                                  },
                                },
                                flatPrice: {
                                  ...tier.flatPrice,
                                  dinero: {
                                    ...tier.flatPrice.dinero,
                                    currency: {
                                      ...tier.flatPrice.dinero.currency,
                                      code: currency,
                                    },
                                  },
                                },
                              })),
                            },
                          })
                          .where(and(eq(schema.planVersionFeatures.id, feature.id)))
                      }

                      if (config.price) {
                        return await tx
                          .update(schema.planVersionFeatures)
                          .set({
                            config: {
                              ...config,
                              price: {
                                ...config.price,
                                dinero: {
                                  ...config.price.dinero,
                                  currency: {
                                    ...config.price.dinero.currency,
                                    code: currency,
                                  },
                                },
                              },
                            },
                          })
                          .where(and(eq(schema.planVersionFeatures.id, feature.id)))
                      }

                      break
                    }

                    case "package": {
                      const config = configPackageSchema.parse(feature.config)

                      return await tx
                        .update(schema.planVersionFeatures)
                        .set({
                          config: {
                            ...config,
                            price: {
                              ...config.price,
                              dinero: {
                                ...config.price.dinero,
                                currency: {
                                  ...config.price.dinero.currency,
                                  code: currency,
                                },
                              },
                            },
                          },
                        })
                        .where(and(eq(schema.planVersionFeatures.id, feature.id)))
                    }

                    default:
                      break
                  }
                })
              )
            })
            .catch((err) => {
              console.error(err)
              tx.rollback()
              throw err
            })
        }

        const data = await tx
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
            updatedAtM: Date.now(),
          })
          .where(and(eq(schema.versions.id, planVersionData.id)))
          .returning()
          .then((re) => re[0])

        return data
      })

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
  duplicate: protectedProjectProcedure
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

      // only owner and admin can duplicate a plan version
      opts.ctx.verifyRole(["OWNER", "ADMIN"])

      const planVersionData = await opts.ctx.db.query.versions.findFirst({
        where: (version, { and, eq }) => and(eq(version.id, id), eq(version.projectId, project.id)),
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
          // get the count of versions for this plan
          const countVersionsPlan = await tx
            .select({ count: sql<number>`count(*)` })
            .from(schema.versions)
            .where(
              and(
                eq(schema.versions.projectId, project.id),
                eq(schema.versions.planId, planVersionData.planId)
              )
            )
            .then((res) => res[0]?.count ?? 0)

          // duplicate the plan version
          const planVersionDataDuplicated = await tx
            .insert(schema.versions)
            .values({
              ...planVersionData,
              id: planVersionId,
              metadata: {
                // external Id shouldn't be duplicated
                paymentMethodRequired: planVersionData.metadata?.paymentMethodRequired,
              },
              latest: false,
              active: true,
              status: "draft",
              createdAtM: Date.now(),
              updatedAtM: Date.now(),
              version: Number(countVersionsPlan) + 1,
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
                    createdAtM: Date.now(),
                    updatedAtM: Date.now(),
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
          }
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "error creating version",
          })
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

  publish: protectedProjectProcedure
    .input(planVersionSelectBaseSchema.partial().required({ id: true }))
    .output(
      z.object({
        planVersion: planVersionSelectBaseSchema,
      })
    )
    .mutation(async (opts) => {
      const { id } = opts.input

      const project = opts.ctx.project

      // only owner and admin can publish a plan version
      opts.ctx.verifyRole(["OWNER", "ADMIN"])

      const planVersionData = await opts.ctx.db.query.versions.findFirst({
        with: {
          planFeatures: {
            with: {
              feature: true,
            },
          },
          project: true,
          plan: {
            columns: {
              slug: true,
            },
          },
        },
        where: (version, { and, eq }) => and(eq(version.id, id), eq(version.projectId, project.id)),
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
          message: "Cannot update a published version, read only",
        })
      }

      if (planVersionData.planFeatures.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot publish a version without features",
        })
      }

      // we need to create each product on the payment provider
      const planVersionDataUpdated = await opts.ctx.db.transaction(async (tx) => {
        try {
          // depending on the provider we need to create the products
          switch (planVersionData.paymentProvider) {
            case "stripe": {
              const stripePaymentProvider = new StripePaymentProvider({
                logger: opts.ctx.logger,
              })
              // create the products
              await Promise.all(
                planVersionData.planFeatures.map(async (planFeature) => {
                  const productName = `${planVersionData.project.name} - ${planFeature.feature.slug} from ${APP_NAME}`

                  const { err } = await stripePaymentProvider.upsertProduct({
                    id: planFeature.featureId,
                    name: productName,
                    type: "service",
                    // only pass the description if it is not empty
                    ...(planFeature.feature.description
                      ? {
                          description: planFeature.feature.description,
                        }
                      : {}),
                  })

                  if (err) {
                    throw new TRPCError({
                      code: "INTERNAL_SERVER_ERROR",
                      message: "Error syncs product with stripe",
                    })
                  }
                })
              )

              break
            }
            default:
              opts.ctx.logger.error("Payment provider not supported", {
                paymentProvider: planVersionData.paymentProvider,
              })

              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Payment provider not supported",
              })
          }

          // verify if the payment method is required
          const { err, val: totalPricePlan } = calculateFlatPricePlan({
            planVersion: planVersionData,
          })

          if (err) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Error calculating price plan",
            })
          }

          // if the flat price is not zero, then the payment method is required
          const paymentMethodRequired = !isZero(totalPricePlan.dinero)

          // set the latest version to false if there is a latest version for this plan
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

          const versionUpdated = await tx
            .update(schema.versions)
            .set({
              status: "published",
              updatedAtM: Date.now(),
              publishedAt: Date.now(),
              publishedBy: opts.ctx.userId,
              latest: true,
              ...(paymentMethodRequired && {
                metadata: {
                  ...planVersionData.metadata,
                  paymentMethodRequired,
                },
              }),
            })
            .where(and(eq(schema.versions.id, planVersionData.id)))
            .returning()
            .then((re) => re[0])

          if (!versionUpdated) {
            opts.ctx.logger.error("Version not updated", {
              planVersionData,
            })

            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Error publishing version",
            })
          }

          return versionUpdated
        } catch (error) {
          opts.ctx.logger.error("Error publishing version", {
            error,
          })

          tx.rollback()

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "error publishing version",
          })
        }
      })

      return {
        planVersion: planVersionDataUpdated,
      }
    }),
  getById: protectedProjectProcedure
    .input(
      z.object({
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
      const { id } = opts.input
      const project = opts.ctx.project

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
        where: (version, { and, eq }) => and(eq(version.projectId, project.id), eq(version.id, id)),
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

  listByProjectId: protectedProcedure
    .input(
      z.object({
        published: z.boolean().optional(),
        enterprisePlan: z.boolean().optional(),
        active: z.boolean().optional(),
        projectId: z.string(),
      })
    )
    .output(
      z.object({
        planVersions: planVersionSelectBaseSchema
          .extend({
            plan: planSelectBaseSchema,
            planFeatures: z.array(
              planVersionFeatureSelectBaseSchema.extend({
                feature: featureSelectBaseSchema,
              })
            ),
          })
          .array(),
      })
    )
    .query(async (opts) => {
      const { published, enterprisePlan, active, projectId } = opts.input

      const needsPublished = published === undefined || published
      const needsActive = active === undefined || active

      const planVersionData = await opts.ctx.db.query.versions.findMany({
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
            eq(version.projectId, projectId),
            // get published versions by default, only get unpublished versions if the user wants it
            needsPublished ? eq(version.status, "published") : undefined,
            // get active versions by default, only get inactive versions if the user wants it
            needsActive ? eq(version.active, true) : undefined
          ),
      })

      if (planVersionData.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Plan version not found",
        })
      }

      // TODO: improve this query so I can filter enterprises plans
      return {
        planVersions: enterprisePlan
          ? planVersionData
          : planVersionData.filter((version) => !version.plan.enterprisePlan),
      }
    }),
  listByActiveProject: protectedProjectProcedure
    .input(
      z.object({
        published: z.boolean().optional(),
        enterprisePlan: z.boolean().optional(),
        active: z.boolean().optional(),
        projectId: z.string().optional(),
        latest: z.boolean().optional(),
      })
    )
    .output(
      z.object({
        planVersions: planVersionSelectBaseSchema
          .extend({
            plan: planSelectBaseSchema,
            planFeatures: z.array(
              planVersionFeatureSelectBaseSchema.extend({
                feature: featureSelectBaseSchema,
              })
            ),
          })
          .array(),
      })
    )
    .query(async (opts) => {
      const { published, enterprisePlan, active, latest } = opts.input
      const project = opts.ctx.project

      const needsPublished = published === undefined || published
      const needsActive = active === undefined || active
      const needsLatest = latest === undefined || latest

      const planVersionData = await opts.ctx.db.query.versions.findMany({
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
            // get published versions by default, only get unpublished versions if the user wants it
            needsPublished ? eq(version.status, "published") : undefined,
            // get active versions by default, only get inactive versions if the user wants it
            needsActive ? eq(version.active, true) : undefined,
            needsLatest ? undefined : eq(version.latest, true)
          ),
      })

      if (planVersionData.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Plan version not found",
        })
      }

      // TODO: improve this query so I can filter enterprises plans
      return {
        planVersions: enterprisePlan
          ? planVersionData
          : planVersionData.filter((version) => !version.plan.enterprisePlan),
      }
    }),

  listByUnpriceProject: protectedProcedure
    .input(
      z.object({
        published: z.boolean().optional(),
        enterprisePlan: z.boolean().optional(),
        active: z.boolean().optional(),
        projectId: z.string().optional(),
        latest: z.boolean().optional(),
      })
    )
    .output(
      z.object({
        planVersions: planVersionSelectBaseSchema
          .extend({
            plan: planSelectBaseSchema,
            planFeatures: z.array(
              planVersionFeatureSelectBaseSchema.extend({
                feature: featureSelectBaseSchema,
              })
            ),
          })
          .array(),
      })
    )
    .query(async (opts) => {
      const { published, enterprisePlan, active, latest } = opts.input

      const project = await opts.ctx.db.query.projects.findFirst({
        where: (fields, operators) =>
          operators.and(
            operators.eq(fields.slug, "unprice-admin"),
            operators.eq(fields.isMain, true)
          ),
      })

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Main project not found",
        })
      }

      const needsPublished = published === undefined || published
      const needsActive = active === undefined || active
      const needsLatest = latest === undefined || latest

      const planVersionData = await opts.ctx.db.query.versions.findMany({
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
            // get published versions by default, only get unpublished versions if the user wants it
            needsPublished ? eq(version.status, "published") : undefined,
            // get active versions by default, only get inactive versions if the user wants it
            needsActive ? eq(version.active, true) : undefined,
            needsLatest ? undefined : eq(version.latest, true)
          ),
      })

      if (planVersionData.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Plan version not found",
        })
      }

      // TODO: improve this query so I can filter enterprises plans
      return {
        planVersions: enterprisePlan
          ? planVersionData
          : planVersionData.filter((version) => !version.plan.enterprisePlan),
      }
    }),
})
