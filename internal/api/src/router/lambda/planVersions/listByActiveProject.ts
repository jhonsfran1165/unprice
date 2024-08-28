import { TRPCError } from "@trpc/server"
import {
  featureSelectBaseSchema,
  planSelectBaseSchema,
  planVersionFeatureSelectBaseSchema,
  planVersionSelectBaseSchema,
} from "@unprice/db/validators"
import { z } from "zod"
import { protectedProjectProcedure } from "../../../trpc"

export const listByActiveProject = protectedProjectProcedure
  .input(
    z.object({
      published: z.boolean().optional(),
      enterprisePlan: z.boolean().optional(),
      active: z.boolean().optional(),
      projectSlug: z.string().optional(),
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
  })
