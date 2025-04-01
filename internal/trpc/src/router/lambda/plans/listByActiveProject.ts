import {
  featureVerificationSchema,
  planSelectBaseSchema,
  planVersionSelectBaseSchema,
} from "@unprice/db/validators"
import { z } from "zod"

import { protectedProjectProcedure } from "#trpc"
import { featureGuard } from "#utils/feature-guard"

export const listByActiveProject = protectedProjectProcedure
  .input(
    z.object({
      fromDate: z.number().optional(),
      toDate: z.number().optional(),
      published: z.boolean().optional(),
      active: z.boolean().optional(),
    })
  )
  .output(
    z.object({
      plans: z.array(
        planSelectBaseSchema.extend({
          versions: z.array(
            planVersionSelectBaseSchema.pick({
              id: true,
              status: true,
              title: true,
              currency: true,
              version: true,
            })
          ),
        })
      ),
      error: featureVerificationSchema,
    })
  )
  .query(async (opts) => {
    const { fromDate, toDate, published, active } = opts.input
    const project = opts.ctx.project

    const workspace = opts.ctx.project.workspace
    const customerId = workspace.unPriceCustomerId
    const featureSlug = "plans"

    // check if the customer has access to the feature
    const result = await featureGuard({
      customerId,
      featureSlug,
      ctx: opts.ctx,
      skipCache: true,
      isInternal: workspace.isInternal,
    })

    if (!result.access) {
      return {
        plans: [],
        error: result,
      }
    }

    const needsPublished = published === undefined || published
    const needsActive = active === undefined || active

    const plans = await opts.ctx.db.query.plans.findMany({
      with: {
        versions: {
          where: (version, { eq }) =>
            // get published versions by default, only get unpublished versions if the user wants it
            needsPublished ? eq(version.status, "published") : undefined,
          orderBy: (version, { desc }) => [desc(version.createdAtM)],
          columns: {
            status: true,
            id: true,
            title: true,
            currency: true,
            version: true,
          },
        },
      },
      where: (plan, { eq, and, between, gte, lte }) =>
        and(
          eq(plan.projectId, project.id),
          fromDate && toDate ? between(plan.createdAtM, fromDate, toDate) : undefined,
          fromDate ? gte(plan.createdAtM, fromDate) : undefined,
          toDate ? lte(plan.createdAtM, toDate) : undefined,
          // get active versions by default, only get inactive versions if the user wants it
          needsActive ? eq(plan.active, true) : undefined
        ),
    })

    return {
      plans,
      error: result,
    }
  })
