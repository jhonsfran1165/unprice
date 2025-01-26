import { TRPCError } from "@trpc/server"
import { projectSelectBaseSchema, workspaceSelectBase } from "@unprice/db/validators"
import { z } from "zod"
import { protectedWorkspaceProcedure } from "../../../trpc"
import { featureGuard } from "../../../utils/feature-guard"

export const getById = protectedWorkspaceProcedure
  .input(z.object({ id: z.string() }))
  .output(
    z.object({
      project: projectSelectBaseSchema.extend({
        workspace: workspaceSelectBase,
      }),
    })
  )
  .query(async (opts) => {
    const workspace = opts.ctx.workspace
    const customerId = workspace.unPriceCustomerId
    const featureSlug = "projects"

    // check if the customer has access to the feature
    await featureGuard({
      customerId,
      featureSlug,
      ctx: opts.ctx,
      skipCache: true,
      isInternal: workspace.isInternal,
      // getById endpoint does not need to throw an error
      throwOnNoAccess: false,
    })

    const projectData = await opts.ctx.db.query.projects.findFirst({
      with: {
        workspace: true,
      },
      where: (project, { eq, and }) =>
        and(eq(project.slug, opts.input.id), eq(project.workspaceId, workspace.id)),
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
