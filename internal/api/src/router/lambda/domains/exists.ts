import { z } from "zod"
import { protectedWorkspaceProcedure } from "../../../trpc"

export const exists = protectedWorkspaceProcedure
  .input(z.object({ domain: z.string() }))
  .output(z.object({ exist: z.boolean() }))
  .mutation(async (opts) => {
    const domain = await opts.ctx.db.query.domains.findFirst({
      where: (d, { eq }) => eq(d.name, opts.input.domain),
    })

    return {
      exist: !!domain,
    }
  })
