import { TRPCError } from "@trpc/server"
import type { Analytics } from "@unprice/analytics"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"
import { TIMEOUTS, withTimeout } from "#utils/timeout"

export const getBrowserVisits = protectedProjectProcedure
  .input(z.custom<Parameters<Analytics["getBrowserVisits"]>[0]>())
  .output(
    z.object({
      data: z.custom<Awaited<ReturnType<Analytics["getBrowserVisits"]>>["data"]>(),
    })
  )
  .query(async (opts) => {
    const { intervalDays, page_id } = opts.input
    const projectId = opts.ctx.project.id

    if (!page_id || page_id === "") {
      return { data: [] }
    }

    const page = await opts.ctx.db.query.pages.findFirst({
      where: (table, { eq, and }) => and(eq(table.id, page_id), eq(table.projectId, projectId)),
    })

    if (!page) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Page not found",
      })
    }

    try {
      const result = await withTimeout(
        opts.ctx.analytics.getBrowserVisits({
          page_id: page.id,
          intervalDays,
          project_id: projectId,
        }),
        TIMEOUTS.ANALYTICS,
        "getBrowserVisits analytics request timeout"
      )

      return { data: result.data }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"

      opts.ctx.logger.error("getBrowserVisits failed", {
        error: errorMessage,
        projectId,
        intervalDays,
        isTimeout: errorMessage.includes("timeout"),
      })

      // Return empty data as fallback
      return { data: [] }
    }
  })
