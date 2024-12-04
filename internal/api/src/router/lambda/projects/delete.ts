import { TRPCError } from "@trpc/server"
import { eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { projectSelectBaseSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedProjectProcedure } from "../../../trpc"

export const deleteProject = protectedProjectProcedure
  .input(
    z.object({
      projectId: z.string().optional(),
      projectSlug: z.string().optional(),
    })
  )
  .output(
    z.object({
      project: projectSelectBaseSchema,
    })
  )
  .mutation(async (opts) => {
    const project = opts.ctx.project

    // only owner and admin can delete a project
    opts.ctx.verifyRole(["OWNER", "ADMIN"])

    if (project.isMain) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot delete main project",
      })
    }

    const deletedProject = await opts.ctx.db
      .delete(schema.projects)
      .where(eq(schema.projects.id, project.id))
      .returning()
      .then((res) => res[0] ?? undefined)

    if (!deletedProject?.id) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error deleting project",
      })
    }

    return {
      project: deletedProject,
    }
  })
