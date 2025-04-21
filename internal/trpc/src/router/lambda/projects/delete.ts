import { TRPCError } from "@trpc/server"
import { eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { projectSelectBaseSchema } from "@unprice/db/validators"
import { z } from "zod"

import { protectedProjectProcedure } from "#trpc"
import { featureGuard } from "#utils/feature-guard"
import { reportUsageFeature } from "#utils/shared"

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
    const result = await featureGuard({
      customerId,
      featureSlug,
      isMain: workspace.isMain,
      metadata: {
        action: "delete",
      },
    })

    if (!result.success) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: `You don't have access to this feature ${result.deniedReason}`,
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

    opts.ctx.waitUntil(
      reportUsageFeature({
        customerId,
        featureSlug,
        usage: -1,
        isMain: workspace.isMain,
        metadata: {
          action: "remove",
        },
      })
    )

    return {
      project: deletedProject,
    }
  })
