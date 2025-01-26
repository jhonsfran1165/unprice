import { TRPCError } from "@trpc/server"
import {
  planSelectBaseSchema,
  planVersionSelectBaseSchema,
  projectExtendedSelectSchema,
} from "@unprice/db/validators"
import { z } from "zod"

import { protectedProjectProcedure } from "../../../trpc"
import { featureGuard } from "../../../utils/feature-guard"

export const getVersionsBySlug = protectedProjectProcedure
  .input(z.object({ slug: z.string() }))
  .output(
    z.object({
      plan: planSelectBaseSchema.extend({
        versions: z.array(
          planVersionSelectBaseSchema.extend({
            subscriptions: z.number(),
          })
        ),
      }),
      project: projectExtendedSelectSchema,
    })
  )
  .query(async (opts) => {
    const { slug } = opts.input
    const project = opts.ctx.project

    const workspace = opts.ctx.project.workspace
    const customerId = workspace.unPriceCustomerId
    const featureSlug = "plans"

    // check if the customer has access to the feature
    await featureGuard({
      customerId,
      featureSlug,
      ctx: opts.ctx,
      skipCache: true,
      isInternal: workspace.isInternal,
      // exist endpoint does not need to throw an error
      throwOnNoAccess: false,
    })

    // TODO: better rewrite this query to use joins instead of subqueries
    const planWithVersions = await opts.ctx.db.query.plans
      .findFirst({
        with: {
          versions: {
            orderBy: (version, { desc }) => [desc(version.createdAtM)],
            with: {
              phases: {
                columns: {
                  id: true,
                  subscriptionId: true,
                },
              },
            },
          },
        },
        where: (plan, { eq, and }) => and(eq(plan.slug, slug), eq(plan.projectId, project.id)),
      })
      .then((plans) => {
        return (
          plans && {
            ...plans,
            versions: plans.versions.map((version) => ({
              ...version,
              // TODO: fix this, we should count the number of subscriptions per plan version
              subscriptions: version.phases.length,
            })),
          }
        )
      })

    if (!planWithVersions) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Plan not found",
      })
    }

    return {
      plan: planWithVersions,
      project: project,
    }
  })
