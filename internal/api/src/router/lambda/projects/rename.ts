import { eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { projectSelectBaseSchema, renameProjectSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedProjectProcedure } from "../../../trpc"

export const rename = protectedProjectProcedure
  .input(renameProjectSchema)
  .output(
    z.object({
      project: projectSelectBaseSchema.optional(),
    })
  )
  .mutation(async (opts) => {
    const { name } = opts.input
    const project = opts.ctx.project

    // only owner and admin can rename a project
    opts.ctx.verifyRole(["OWNER", "ADMIN"])

    const projectRenamed = await opts.ctx.db
      .update(schema.projects)
      .set({
        name,
      })
      .where(eq(schema.projects.id, project.id))
      .returning()
      .then((res) => res[0] ?? undefined)

    return {
      project: projectRenamed,
    }
  })
