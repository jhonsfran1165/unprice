import { TRPCError } from "@trpc/server"
import { APP_NAME } from "@unprice/config"
import { and, eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { calculateFlatPricePlan, planVersionSelectBaseSchema } from "@unprice/db/validators"
import { isZero } from "dinero.js"
import { z } from "zod"
import { StripePaymentProvider } from "../../../pkg/payment-provider/stripe"
import { protectedProjectProcedure } from "../../../trpc"

export const publish = protectedProjectProcedure
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
            defaultPlan: true,
            enterprisePlan: true,
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
          opts.ctx.logger.error("Error calculating price plan", {
            error: err,
            planVersionId: planVersionData.id,
          })

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
            paymentMethodRequired,
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
  })
