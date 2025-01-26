import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { projectInsertBaseSchema, projectSelectBaseSchema } from "@unprice/db/validators"

import { protectedProjectProcedure } from "../../../trpc"
import { featureGuard } from "../../../utils/feature-guard"

export const update = protectedProjectProcedure
  .input(projectInsertBaseSchema.required({ id: true }))
  .output(
    z.object({
      project: projectSelectBaseSchema,
    })
  )
  .mutation(async (opts) => {
    const { id, name, defaultCurrency, timezone, url } = opts.input
    const workspace = opts.ctx.project.workspace
    const customerId = workspace.unPriceCustomerId
    const featureSlug = "projects"

    // only owner and admin can update a plan
    opts.ctx.verifyRole(["OWNER", "ADMIN"])

    // check if the customer has access to the feature
    await featureGuard({
      customerId,
      featureSlug,
      ctx: opts.ctx,
      skipCache: true,
      isInternal: workspace.isInternal,
      // update endpoint does not need to throw an error
      throwOnNoAccess: false,
    })

    const projectData = await opts.ctx.db.query.projects.findFirst({
      where: (project, { eq }) => eq(project.id, id),
    })

    if (!projectData?.id) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "project not found",
      })
    }

    const updatedProject = await opts.ctx.db
      .update(schema.projects)
      .set({
        name,
        defaultCurrency,
        timezone,
        url,
      })
      .where(eq(schema.projects.id, id))
      .returning()
      .then((re) => re[0])

    if (!updatedProject) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error updating project",
      })
    }

    return {
      project: updatedProject,
    }
  })
