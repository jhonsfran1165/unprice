import type { Analytics } from "@unprice/analytics"
import type { PageOverview } from "@unprice/analytics"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"

export const getPagesOverview = protectedProjectProcedure
  .input(z.custom<Parameters<Analytics["getPagesOverview"]>[0]>())
  .output(
    z.object({
      data: z.custom<PageOverview>(),
      error: z.string().optional(),
    })
  )
  .query(async (opts) => {
    const { intervalDays, pageId } = opts.input
    const projectId = opts.ctx.project.id
    const withAllPage = pageId === "all"

    if (!pageId) {
      return { data: [], error: "Page ID is required" }
    }

    if (withAllPage) {
      const cacheKey = `${projectId}:all:${intervalDays}`
      const result = await opts.ctx.cache.getPagesOverview.swr(cacheKey, async () => {
        const result = await opts.ctx.analytics
          .getPagesOverview({
            intervalDays,
            projectId,
          })
          .then((res) => res.data)

        return result
      })

      if (result.err) {
        opts.ctx.logger.error(result.err.message, {
          projectId,
          intervalDays,
        })

        return { data: [], error: result.err.message }
      }

      const data = result.val ?? []

      return { data }
    }

    const page = await opts.ctx.db.query.pages.findFirst({
      where: (table, { eq, and }) => and(eq(table.id, pageId), eq(table.projectId, projectId)),
    })

    if (!page) {
      return { data: [], error: "Page not found" }
    }

    const cacheKey = `${projectId}:${page.id}:${intervalDays}`
    const result = await opts.ctx.cache.getPagesOverview.swr(cacheKey, async () => {
      const result = await opts.ctx.analytics
        .getPagesOverview({
          pageId: page.id,
          intervalDays,
          projectId,
        })
        .then((res) => res.data)

      return result
    })

    if (result.err) {
      opts.ctx.logger.error(result.err.message, {
        projectId,
        intervalDays,
      })

      return { data: [], error: result.err.message }
    }

    const data = result.val ?? []

    return { data }
  })
