import { TRPCError } from "@trpc/server"
import type { Analytics } from "@unprice/analytics"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"
import { TIMEOUTS, withTimeout } from "#utils/timeout"

export const getPagesOverview = protectedProjectProcedure
  .input(z.custom<Parameters<Analytics["getPagesOverview"]>[0]>())
  .output(
    z.object({
      data: z.custom<Awaited<ReturnType<Analytics["getPagesOverview"]>>["data"]>(),
    })
  )
  .query(async (opts) => {
    const { intervalDays, pageId } = opts.input
    const projectId = opts.ctx.project.id

    if (!pageId || pageId === "") {
      return { data: [] }
    }

    const page = await opts.ctx.db.query.pages.findFirst({
      where: (table, { eq, and }) => and(eq(table.id, pageId), eq(table.projectId, projectId)),
    })

    if (!page) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Page not found",
      })
    }

    try {
      const result = await withTimeout(
        opts.ctx.analytics.getPagesOverview({
          intervalDays,
          pageId,
        }),
        TIMEOUTS.ANALYTICS,
        "getPagesOverview analytics request timeout"
      )

      return { data: result.data }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"

      opts.ctx.logger.error("getPagesOverview failed", {
        error: errorMessage,
        projectId,
        intervalDays,
        isTimeout: errorMessage.includes("timeout"),
      })

      // Return empty data as fallback
      return { data: [] }
    }
  })
