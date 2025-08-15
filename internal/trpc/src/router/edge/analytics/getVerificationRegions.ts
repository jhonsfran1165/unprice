import type { Analytics } from "@unprice/analytics"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"

export const getVerificationRegions = protectedProjectProcedure
  .input(z.custom<Omit<Parameters<Analytics["getFeaturesVerificationRegions"]>[0], "projectId">>())
  .output(
    z.object({
      verifications:
        z.custom<Awaited<ReturnType<Analytics["getFeaturesVerificationRegions"]>>["data"]>(),
    })
  )
  .query(async (opts) => {
    const projectId = opts.ctx.project.id
    const input = opts.input

    const data = await opts.ctx.analytics
      .getFeaturesVerificationRegions({
        projectId,
        region: input.region,
        intervalDays: input.intervalDays,
      })
      .catch((err) => {
        opts.ctx.logger.error(`Failed to get verification regions for project ${projectId}`, {
          error: err.message,
        })

        return {
          data: [],
        }
      })

    return {
      verifications: data.data,
    }
  })
