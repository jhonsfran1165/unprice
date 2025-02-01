import { TRPCError } from "@trpc/server"
import { eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { projectSelectBaseSchema } from "@unprice/db/validators"
import { z } from "zod"

import { protectedProjectProcedure } from "#/trpc"
import { featureGuard } from "#/utils/feature-guard"
import { reportUsageFeature } from "#/utils/shared"

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
    const workspace = opts.ctx.project.workspace
    const customerId = workspace.unPriceCustomerId
    const featureSlug = "projects"

    // only owner can delete a project
    opts.ctx.verifyRole(["OWNER"])

    if (project.isMain) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot delete main project",
      })
    }

    // check if the customer has access to the feature
    await featureGuard({
      customerId,
      featureSlug,
      ctx: opts.ctx,
      skipCache: true,
      // update usage when deleting a project
      updateUsage: true,
      isInternal: workspace.isInternal,
      // delete endpoint does not need to throw an error
      throwOnNoAccess: false,
    })

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

    opts.ctx.waitUntil(
      // report usage for the new project in background
      reportUsageFeature({
        customerId,
        featureSlug,
        usage: -1, // the deleted project
        ctx: opts.ctx,
        isInternal: workspace.isInternal,
      })
    )

    return {
      project: deletedProject,
    }
  })
