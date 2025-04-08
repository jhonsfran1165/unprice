import { projectSelectBaseSchema, workspaceSelectBase } from "@unprice/db/validators"
import { z } from "zod"

import { protectedWorkspaceProcedure } from "#trpc"
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
    })
  )
  .query(async (opts) => {
    const workspace = opts.ctx.workspace

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
