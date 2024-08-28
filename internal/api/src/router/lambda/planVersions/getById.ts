import { TRPCError } from "@trpc/server"
import {
  featureSelectBaseSchema,
  planSelectBaseSchema,
  planVersionFeatureSelectBaseSchema,
  planVersionSelectBaseSchema,
} from "@unprice/db/validators"
import { z } from "zod"
import { protectedProjectProcedure } from "../../../trpc"

export const getById = protectedProjectProcedure
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
  })
