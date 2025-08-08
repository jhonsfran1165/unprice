import type { Analytics } from "@unprice/analytics"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"

export const getPlanClickBySessionId = protectedProjectProcedure
  .input(z.custom<Parameters<Analytics["getPlanClickBySessionId"]>[0]>())
  .output(
    z.object({
      planClick: z.custom<Awaited<ReturnType<Analytics["getPlanClickBySessionId"]>>["data"]>(),
    })
  )
  .query(async (opts) => {
    const projectId = opts.ctx.project.id
    const input = opts.input

    const data = await opts.ctx.analytics
      .getPlanClickBySessionId({
        session_id: input.session_id,
        action: input.action,
      })
      .catch((err) => {
        opts.ctx.logger.error(`Failed to get verifications for project ${projectId}`, {
          error: err.message,
        })

        return {
          data: [],
        }
      })

    return {
      planClick: data.data,
    }
  })
