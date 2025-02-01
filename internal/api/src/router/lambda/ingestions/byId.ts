import { TRPCError } from "@trpc/server"
import { ingestionSelectSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedWorkspaceProcedure } from "#trpc"
import { projectWorkspaceGuard } from "#utils/project-workspace-guard"

export const byId = protectedWorkspaceProcedure
  .input(z.object({ id: z.string(), projectSlug: z.string() }))
  .output(ingestionSelectSchema)
  .query(async (opts) => {
    const projectSlug = opts.input.projectSlug

    const { project } = await projectWorkspaceGuard({
      projectSlug,
      ctx: opts.ctx,
    })

    const ingestion = await opts.ctx.db.query.ingestions.findFirst({
      where: (ingestion, { eq, and }) =>
        and(eq(ingestion.id, opts.input.id), eq(ingestion.projectId, project.id)),
    })

    if (!ingestion) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Ingestion not found",
      })
    }

    return ingestion
  })
