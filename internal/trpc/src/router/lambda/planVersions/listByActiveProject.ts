import { TRPCError } from "@trpc/server"
import { getPlanVersionApiResponseSchema, getPlanVersionListSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"
import { unprice } from "#utils/unprice"

export const listByActiveProject = protectedProjectProcedure
  .input(getPlanVersionListSchema)
  .output(
    z.object({
      planVersions: getPlanVersionApiResponseSchema.array(),
    })
  )
  .query(async (opts) => {
    const planVersions = await unprice.plans.listPlanVersions(opts.input)

    if (planVersions.error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: planVersions.error.message,
      })
    }

    return {
      planVersions: planVersions.result.planVersions,
    }
  })
