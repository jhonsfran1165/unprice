import {
  featureSelectBaseSchema,
  planSelectBaseSchema,
  planVersionFeatureSelectBaseSchema,
  planVersionSelectBaseSchema,
} from "@unprice/db/validators"
import { z } from "zod"
import { protectedProcedure } from "#trpc"

// global endpoint, no need to check for feature access
export const listByProjectId = protectedProcedure
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
      return {
        planVersions: [],
      }
    }

    // TODO: improve this query so I can filter enterprises plans
    return {
      planVersions: enterprisePlan
        ? planVersionData
        : planVersionData.filter((version) => !version.plan.enterprisePlan),
    }
  })
