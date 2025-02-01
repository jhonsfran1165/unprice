import { projectSelectBaseSchema, workspaceSelectBase } from "@unprice/db/validators"
import { z } from "zod"

import { protectedWorkspaceProcedure } from "#/trpc"
import { featureGuard } from "#/utils/feature-guard"
import { getRandomPatternStyle } from "#/utils/generate-pattern"

export const listByActiveWorkspace = protectedWorkspaceProcedure
  .input(z.void())
  .output(
    z.object({
      projects: z.array(
        projectSelectBaseSchema.extend({
          styles: z.object({
            backgroundImage: z.string(),
          }),
          workspace: workspaceSelectBase.pick({
            slug: true,
          }),
        })
      ),
    })
  )
  .query(async (opts) => {
    const activeWorkspaceId = opts.ctx.workspace.id
    const customerId = opts.ctx.workspace.unPriceCustomerId
    const featureSlug = "projects"

    // check if the customer has access to the feature
    await featureGuard({
      customerId,
      featureSlug,
      ctx: opts.ctx,
      skipCache: true,
      isInternal: opts.ctx.workspace.isInternal,
      // list endpoint does not need to throw an error
      throwOnNoAccess: false,
    })

    const workspaceProjects = await opts.ctx.db.query.workspaces.findFirst({
      with: {
        projects: {
          orderBy: (pj, { desc }) => [desc(pj.createdAtM)],
        },
      },
      where: (ws, { eq }) => eq(ws.id, activeWorkspaceId),
    })

    if (!workspaceProjects) {
      return {
        projects: [],
      }
    }

    const { projects, ...rest } = workspaceProjects

    return {
      projects: projects.map((project) => ({
        ...project,
        workspace: rest,
        styles: getRandomPatternStyle(project.id),
      })),
    }
  })
