import { projectSelectBaseSchema, workspaceSelectBase } from "@unprice/db/validators"
import { z } from "zod"
import { protectedProcedure } from "../../../trpc"
import { getRandomPatternStyle } from "../../../utils/generate-pattern"
import { workspaceGuard } from "../../../utils/workspace-guard"

// TODO: Don't hardcode the limit to PRO
const PROJECT_LIMITS = {
  FREE: 1,
  PRO: 3,
} as const

export const listByWorkspace = protectedProcedure
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
      limit: z.number(),
      limitReached: z.boolean(),
    })
  )
  .query(async (opts) => {
    const { workspaceSlug } = opts.input

    const { workspace: workspaceData } = await workspaceGuard({
      workspaceSlug: workspaceSlug,
      ctx: opts.ctx,
    })

    const workspaceProjects = await opts.ctx.db.query.workspaces.findFirst({
      with: {
        projects: {
          orderBy: (project, { desc }) => [desc(project.createdAtM)],
        },
      },
      where: (workspace, { eq }) => eq(workspace.id, workspaceData.id),
    })

    if (!workspaceProjects) {
      return {
        projects: [],
        limit: PROJECT_LIMITS.PRO,
        limitReached: false,
      }
    }

    const { projects, ...rest } = workspaceProjects

    // TODO: Don't hardcode the limit to PRO
    return {
      projects: projects.map((project) => ({
        ...project,
        workspace: rest,
        styles: getRandomPatternStyle(project.id),
      })),
      limit: PROJECT_LIMITS.PRO,
      limitReached: projects.length >= PROJECT_LIMITS.PRO,
    }
  })
