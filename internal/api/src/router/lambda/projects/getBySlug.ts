import { TRPCError } from "@trpc/server"
import { projectSelectBaseSchema, workspaceSelectBase } from "@unprice/db/validators"
import { z } from "zod"
import { protectedWorkspaceProcedure } from "../../../trpc"

export const getBySlug = protectedWorkspaceProcedure
  .input(z.object({ slug: z.string() }))
  .output(
    z.object({
      project: projectSelectBaseSchema.extend({
        workspace: workspaceSelectBase,
      }),
    })
  )
  .query(async (opts) => {
    const workspace = opts.ctx.workspace

    const projectData = await opts.ctx.db.query.projects.findFirst({
      with: {
        workspace: true,
      },
      where: (project, { eq, and }) =>
        and(eq(project.slug, opts.input.slug), eq(project.workspaceId, workspace.id)),
    })

    if (!projectData) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Project not found",
      })
    }

    return {
      project: projectData,
    }
  })