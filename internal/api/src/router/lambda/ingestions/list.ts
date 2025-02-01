import { protectedWorkspaceProcedure } from "#/trpc"
import { projectWorkspaceGuard } from "#/utils"
import { ingestionSelectSchema } from "@unprice/db/validators"
import { z } from "zod"

export const list = protectedWorkspaceProcedure
  .input(
    z.object({
      projectSlug: z.string(),
      limit: z.number().optional(),
    })
  )
  .output(z.array(ingestionSelectSchema.extend({ adds: z.number(), subs: z.number() })))
  .query(async (opts) => {
    const projectSlug = opts.input.projectSlug

    const { project } = await projectWorkspaceGuard({
      projectSlug,
      ctx: opts.ctx,
    })

    const ingestions = await opts.ctx.db.query.ingestions.findMany({
      where: (ingestion, { eq }) => eq(ingestion.projectId, project.id),
      limit: opts.input.limit,
      orderBy: (ingestion, { desc }) => [desc(ingestion.createdAtM)],
    })

    return ingestions.map((ingestion) => ({
      ...ingestion,
      adds: Math.floor(Math.random() * 10),
      subs: Math.floor(Math.random() * 10),
    }))
  })
