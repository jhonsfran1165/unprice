import { TRPCError } from "@trpc/server"
import {
  customerEntitlementSchema,
  featureSelectBaseSchema,
  planVersionFeatureSelectBaseSchema,
} from "@unprice/db/validators"
import { z } from "zod"
import { protectedProjectProcedure } from "../../../trpc"
import { getEntitlements } from "../../../utils/shared"

export const getUsageCustomerUnprice = protectedProjectProcedure
  .input(
    z.object({
      start: z.number(),
      end: z.number(),
      customerId: z.string(),
    })
  )
  .output(
    z.object({
      featuresWithUsage: planVersionFeatureSelectBaseSchema
        .extend({
          feature: featureSelectBaseSchema,
          usage: customerEntitlementSchema.omit({
            createdAtM: true,
            updatedAtM: true,
          }),
        })
        .array(),
    })
  )
  .query(async (opts) => {
    const project = opts.ctx.project
    const { start, end, customerId } = opts.input

    const res = await getEntitlements({
      customerId,
      projectId: project.id,
      ctx: opts.ctx,
    })

    const totalUsage = await opts.ctx.analytics
      .getTotalUsagePerCustomer({
        customerId,
        projectId: project.id,
        start,
        end,
      })
      .then((data) => data.data)

    const usage = res.map((r) => {
      const usageFeature = totalUsage.find((u) => u.featureSlug === r.featureSlug)

      return {
        ...r,
        usage: usageFeature ? usageFeature[r.aggregationMethod] || 0 : 0,
      }
    })

    const featuresIds = res.map((r) => r.featurePlanVersionId)

    const features = await opts.ctx.db.query.planVersionFeatures.findMany({
      with: {
        feature: true,
      },
      where: (planVersionFeatures, { inArray, and, eq }) =>
        and(
          inArray(planVersionFeatures.id, featuresIds),
          eq(planVersionFeatures.projectId, project.id)
        ),
    })

    const featuresWithUsage = usage.map((u) => {
      const feature = features.find((f) => f.id === u.featurePlanVersionId)

      if (!feature) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Feature not found",
        })
      }

      return {
        ...feature,
        usage: u,
      }
    })

    return {
      featuresWithUsage: featuresWithUsage,
    }
  })
