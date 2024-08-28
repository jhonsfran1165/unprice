import { TRPCError } from "@trpc/server"
import { planSelectBaseSchema, planVersionSelectBaseSchema } from "@unprice/db/validators"
import { z } from "zod"

import { protectedProjectProcedure } from "../../../trpc"

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
    })
  )
  .query(async (opts) => {
    const { slug } = opts.input
    const project = opts.ctx.project

    // TODO: better rewrite this query to use joins instead of subqueries
    const planWithVersions = await opts.ctx.db.query.plans
      .findFirst({
        with: {
          versions: {
            orderBy: (version, { desc }) => [desc(version.createdAtM)],
            with: {
              subscriptions: {
                columns: {
                  id: true,
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
              subscriptions: version.subscriptions.length ?? 0,
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
    }
  })
