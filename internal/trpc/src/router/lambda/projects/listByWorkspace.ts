import {
  featureVerificationSchema,
  projectSelectBaseSchema,
  workspaceSelectBase,
} from "@unprice/db/validators"
import { z } from "zod"

import { protectedWorkspaceProcedure } from "#trpc"
import { featureGuard } from "#utils/feature-guard"
import { getRandomPatternStyle } from "#utils/generate-pattern"

export const listByWorkspace = protectedWorkspaceProcedure
  .input(z.object({ workspaceSlug: z.string() }))
  .output(
    z.object({
      projects: z.array(
        projectSelectBaseSchema.extend({
          styles: z.object({
            backgroundImage: z.string(),
          }),
          workspace: workspaceSelectBase.pick({
            slug: true,
            plan: true,
          }),
        })
      ),
      error: featureVerificationSchema,
    })
  )
  .query(async (opts) => {
    const workspace = opts.ctx.workspace
    const customerId = workspace.unPriceCustomerId
    const featureSlug = "projects"

    // check if the customer has access to the feature
    const result = await featureGuard({
      customerId,
      featureSlug,
      isMain: workspace.isMain,
      metadata: {
        action: "listByWorkspace",
      },
    })

    if (!result.success) {
      return {
        error: result,
        projects: [],
      }
    }

    const workspaceProjects = await opts.ctx.db.query.workspaces.findFirst({
      with: {
        projects: {
          orderBy: (pj, { desc }) => [desc(pj.createdAtM)],
        },
      },
      where: (ws, { eq }) => eq(ws.id, workspace.id),
    })

    if (!workspaceProjects) {
      return {
        projects: [],
        error: result,
      }
    }

    const { projects, ...rest } = workspaceProjects

    return {
      projects: projects.map((project) => ({
        ...project,
        workspace: rest,
        styles: getRandomPatternStyle(project.id),
      })),
      error: result,
    }
  })
