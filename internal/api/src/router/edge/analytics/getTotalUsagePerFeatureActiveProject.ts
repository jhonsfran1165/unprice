import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { protectedApiOrActiveProjectProcedure } from "../../../trpc"

export const getTotalUsagePerFeatureActiveProject = protectedApiOrActiveProjectProcedure
  .input(
    z.object({
      start: z.number(),
      end: z.number(),
    })
  )
  .query(async (opts) => {
    const project = opts.ctx.project
    const { start, end } = opts.input

    const usage = await opts.ctx.analytics
      .getTotalUsagePerProject({
        projectId: project.id,
        start: start,
        end: end,
      })
      .then((res) => res.data)

    if (!usage) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "You are not subscribed to this workspace",
      })
    }

    // // get all features configured for the project
    // const featuresPlanVersion =

    return {
      usage: usage,
    }
  })
