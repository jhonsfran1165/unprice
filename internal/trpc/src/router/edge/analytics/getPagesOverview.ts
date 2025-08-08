import { TRPCError } from "@trpc/server"
import type { Analytics } from "@unprice/analytics"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"

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

    const data = await opts.ctx.analytics
      .getPagesOverview({
        intervalDays,
        pageId,
      })
      .catch((err) => {
        opts.ctx.logger.error("Failed to get pages overview", {
          error: err.message,
        })

        return { data: [] }
      })

    return { data: data.data }
  })
