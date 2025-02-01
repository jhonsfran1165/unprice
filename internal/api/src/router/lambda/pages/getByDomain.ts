import { pageSelectBaseSchema } from "@unprice/db/validators"
import { z } from "zod"

import { rateLimiterProcedure } from "#trpc"

/// public endpoint for getting a page by domain
export const getByDomain = rateLimiterProcedure
  .input(
    z.object({
      domain: z.string(),
    })
  )
  .output(
    z.object({
      page: pageSelectBaseSchema.optional(),
    })
  )
  .query(async (opts) => {
    const { domain } = opts.input

    const pageData = await opts.ctx.db.query.pages.findFirst({
      where: (page, { eq, or }) => or(eq(page.customDomain, domain), eq(page.subdomain, domain)),
    })

    return {
      page: pageData,
    }
  })
