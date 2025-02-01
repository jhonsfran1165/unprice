import { protectedApiOrActiveProjectProcedure } from "#/trpc"
import { TRPCError } from "@trpc/server"
import { z } from "zod"

export const getAllFeatureVerificationsActiveProject = protectedApiOrActiveProjectProcedure
  .input(
    z.object({
      start: z.number(),
      end: z.number(),
    })
  )
  .query(async (opts) => {
    const project = opts.ctx.project
    const { start, end } = opts.input

    const verifications = await opts.ctx.analytics
      .getFeaturesVerifications({
        projectId: project.id,
        start: start,
        end: end,
      })
      .then((res) => res.data)
      .catch(() => {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ups something went wrong getting analytics, contact support",
        })
      })

    // // get all features configured for the project
    // const featuresPlanVersion =

    return {
      verifications: verifications,
    }
  })
