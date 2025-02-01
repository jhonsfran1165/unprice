import { TRPCError } from "@trpc/server"
import { and, eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { planVersionSelectBaseSchema } from "@unprice/db/validators"
import { z } from "zod"

import { protectedProjectProcedure } from "#/trpc"
import { featureGuard } from "#/utils/feature-guard"
import { reportUsageFeature } from "#/utils/shared"

export const remove = protectedProjectProcedure
  .input(
    planVersionSelectBaseSchema
      .pick({
        id: true,
      })
      .required({ id: true })
  )
  .output(z.object({ planVersion: planVersionSelectBaseSchema }))
  .mutation(async (opts) => {
    const { id } = opts.input
    const project = opts.ctx.project
    const workspace = opts.ctx.project.workspace

    // only owner and admin can delete a plan version
    opts.ctx.verifyRole(["OWNER", "ADMIN"])

    // check if the customer has access to the feature
    await featureGuard({
      customerId: workspace.unPriceCustomerId,
      featureSlug: "plan-versions",
      ctx: opts.ctx,
      skipCache: true,
      updateUsage: true,
      isInternal: workspace.isInternal,
      // remove endpoint does not need to throw an error
      throwOnNoAccess: false,
    })

    const planVersionData = await opts.ctx.db.query.versions.findFirst({
      where: (version, { and, eq }) => and(eq(version.id, id), eq(version.projectId, project.id)),
    })

    if (!planVersionData?.id) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "version not found",
      })
    }

    // TODO: should we allow to delete a published version when there is no subscription?
    if (planVersionData?.status === "published") {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Cannot delete a published version, deactivate it instead",
      })
    }

    const deletedPlanVersion = await opts.ctx.db
      .delete(schema.versions)
      .where(
        and(eq(schema.versions.projectId, project.id), eq(schema.versions.id, planVersionData.id))
      )
      .returning()
      .then((data) => data[0])

    if (!deletedPlanVersion?.id) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error deleting version",
      })
    }

    opts.ctx.waitUntil(
      // report usage for the new project in background
      reportUsageFeature({
        customerId: workspace.unPriceCustomerId,
        featureSlug: "plan-versions",
        usage: -1, // the deleted project
        ctx: opts.ctx,
        isInternal: workspace.isInternal,
      })
    )

    return {
      planVersion: deletedPlanVersion,
    }
  })
