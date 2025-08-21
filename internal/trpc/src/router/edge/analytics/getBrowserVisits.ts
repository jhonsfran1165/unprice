import type { Analytics, PageBrowserVisits } from "@unprice/analytics"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"

export const getBrowserVisits = protectedProjectProcedure
  .input(z.custom<Parameters<Analytics["getBrowserVisits"]>[0]>())
  .output(
    z.object({
      data: z.custom<PageBrowserVisits>(),
      error: z.string().optional(),
    })
  )
  .query(async (opts) => {
    const { intervalDays, page_id } = opts.input
    const projectId = opts.ctx.project.id

    if (!page_id || page_id === "") {
      return { data: [], error: "Page ID is required" }
    }

    const page = await opts.ctx.db.query.pages.findFirst({
      where: (table, { eq, and }) => and(eq(table.id, page_id), eq(table.projectId, projectId)),
    })

    if (!page) {
      return { data: [], error: "Page not found" }
    }

    const cacheKey = `${projectId}:${page.id}:${intervalDays}`
    const result = await opts.ctx.cache.pageBrowserVisits.swr(cacheKey, async () => {
      const result = await opts.ctx.analytics
        .getBrowserVisits({
          page_id: page.id,
          intervalDays,
          project_id: projectId,
        })
        .then((res) => res.data)

      return result
    })

    if (result.err) {
      return { data: [], error: result.err.message }
    }

    const data = result.val ?? []

    return { data }
  })
