import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { and, eq, sql } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { planSelectBaseSchema } from "@unprice/db/validators"

import { protectedProjectProcedure } from "#/trpc"
import { featureGuard } from "#/utils/feature-guard"
import { reportUsageFeature } from "#/utils/shared"

export const remove = protectedProjectProcedure
  .input(planSelectBaseSchema.pick({ id: true }))
  .output(z.object({ plan: planSelectBaseSchema }))
  .mutation(async (opts) => {
    const { id } = opts.input
    const project = opts.ctx.project
    const workspace = opts.ctx.project.workspace
    opts.ctx.verifyRole(["OWNER", "ADMIN"])

    // check if the customer has access to the feature
    await featureGuard({
      customerId: workspace.unPriceCustomerId,
      featureSlug: "plans",
      ctx: opts.ctx,
      skipCache: true,
      // update usage when deleting a project
      updateUsage: true,
      isInternal: workspace.isInternal,
      // delete endpoint does not need to throw an error
      throwOnNoAccess: false,
    })

    const countVersionsPlan = await opts.ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.versions)
      .where(and(eq(schema.versions.projectId, project.id), eq(schema.versions.planId, id)))
      .then((res) => res[0]?.count ?? 0)

    if (countVersionsPlan > 0) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "You cannot delete a plan that has versions. Please deactivate it instead",
      })
    }

    const deletedPlan = await opts.ctx.db
      .delete(schema.plans)
      .where(and(eq(schema.plans.projectId, project.id), eq(schema.plans.id, id)))
      .returning()
      .then((data) => data[0])

    if (!deletedPlan) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error deleting plan",
      })
    }

    opts.ctx.waitUntil(
      // report usage for the new project in background
      reportUsageFeature({
        customerId: workspace.unPriceCustomerId,
        featureSlug: "plans",
        usage: -1, // the deleted plan
        ctx: opts.ctx,
        isInternal: workspace.isInternal,
      })
    )

    return {
      plan: deletedPlan,
    }
  })
