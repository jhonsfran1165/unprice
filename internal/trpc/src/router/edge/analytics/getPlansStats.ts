import { type Interval, prepareInterval, statsSchema } from "@unprice/analytics"
import { and, between, count, eq } from "@unprice/db"
import { features, plans, subscriptions, versions } from "@unprice/db/schema"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"

export const getPlansStats = protectedProjectProcedure
  .input(
    z.object({
      interval: z.custom<Interval>(),
    })
  )
  .output(
    z.object({
      stats: statsSchema,
      error: z.string().optional(),
    })
  )
  .query(async (opts) => {
    const projectId = opts.ctx.project.id
    const interval = opts.input.interval
    const preparedInterval = prepareInterval(interval)

    const cacheKey = `${projectId}:${preparedInterval.start}:${preparedInterval.end}`
    const result = await opts.ctx.cache.getPlansStats.swr(cacheKey, async () => {
      // for now I want to get:
      // - total plans
      // - total subscriptions
      // - total plan versions
      // - total features
      const [totalPlans, totalSubscriptions, totalPlanVersions, totalFeatures] = await Promise.all([
        opts.ctx.db
          .select({
            count: count(),
          })
          .from(plans)
          .where(
            and(
              eq(plans.projectId, projectId),
              between(plans.createdAtM, preparedInterval.start, preparedInterval.end)
            )
          )
          .then((e) => e[0])
          .catch((e) => {
            opts.ctx.logger.error(e.message)
            return {
              count: 0,
            }
          }),
        opts.ctx.db
          .select({
            count: count(),
          })
          .from(subscriptions)
          .where(
            and(
              eq(subscriptions.projectId, projectId),
              between(subscriptions.createdAtM, preparedInterval.start, preparedInterval.end)
            )
          )
          .then((e) => e[0])
          .catch((e) => {
            opts.ctx.logger.error(e.message)
            return {
              count: 0,
            }
          }),
        opts.ctx.db
          .select({
            count: count(),
          })
          .from(versions)
          .where(
            and(
              eq(versions.projectId, projectId),
              between(versions.createdAtM, preparedInterval.start, preparedInterval.end)
            )
          )
          .then((e) => e[0])
          .catch((e) => {
            opts.ctx.logger.error(e.message)
            return {
              count: 0,
            }
          }),
        opts.ctx.db
          .select({
            count: count(),
          })
          .from(features)
          .where(
            and(
              eq(features.projectId, projectId),
              between(features.createdAtM, preparedInterval.start, preparedInterval.end)
            )
          )
          .then((e) => e[0])
          .catch((e) => {
            opts.ctx.logger.error(e.message)
            return {
              count: 0,
            }
          }),
      ])

      const stats = {
        totalPlans: {
          total: totalPlans?.count ?? 0,
          title: "Total Plans",
          description: `created in the last ${preparedInterval.label}`,
        },
        totalSubscriptions: {
          total: totalSubscriptions?.count ?? 0,
          title: "Total Subscriptions",
          description: `created in the last ${preparedInterval.label}`,
        },
        totalPlanVersions: {
          total: totalPlanVersions?.count ?? 0,
          title: "Total Plan Versions",
          description: `created in the last ${preparedInterval.label}`,
        },
        totalFeatures: {
          total: totalFeatures?.count ?? 0,
          title: "Total Features",
          description: `created in the last ${preparedInterval.label}`,
        },
      }

      return stats
    })

    if (result.err) {
      return { stats: {}, error: result.err.message }
    }

    const stats = result.val ?? {}

    return { stats }
  })
