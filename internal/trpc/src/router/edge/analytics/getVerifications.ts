import type { Analytics } from "@unprice/analytics"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"

export const getVerifications = protectedProjectProcedure
  .input(z.custom<Parameters<Analytics["getFeaturesVerifications"]>[0]>())
  .output(
    z.object({
      verifications: z.custom<Awaited<ReturnType<Analytics["getFeaturesVerifications"]>>["data"]>(),
    })
  )
  .query(async (opts) => {
    const projectId = opts.ctx.project.id
    const input = opts.input

    const data = await opts.ctx.analytics
      .getFeaturesVerifications({
        projectId,
        start: input.start,
        end: input.end,
      })
      .catch((err) => {
        opts.ctx.logger.error(`Failed to get verifications for project ${projectId}`, {
          error: err,
        })

        return {
          data: [],
        }
      })

    return {
      verifications: data.data,
    }
  })
