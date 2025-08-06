import * as currencies from "@dinero.js/currencies"
import { currencySymbol } from "@unprice/db/utils"
import { calculateFlatPricePlan } from "@unprice/db/validators"
import { add, dinero, toDecimal } from "dinero.js"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"

export const getOverviewStats = protectedProjectProcedure
  .input(z.void())
  .output(
    z.object({
      stats: z.record(
        z.string(),
        z.object({
          total: z.number(),
          title: z.string(),
          description: z.string(),
          unit: z.string().optional(),
        })
      ),
    })
  )
  .query(async (opts) => {
    const projectId = opts.ctx.project.id
    const now = Date.now()

    // TODO: improve this query
    const data = await opts.ctx.db.query.subscriptions.findMany({
      where: (table, { eq }) => eq(table.projectId, projectId),
      columns: {
        id: true,
      },
      with: {
        customer: {
          columns: {
            id: true,
          },
        },
        phases: {
          columns: {
            id: true,
          },
          with: {
            planVersion: {
              with: {
                planFeatures: {
                  with: {
                    feature: true,
                  },
                },
              },
            },
          },
          where: (table, { lte, and, isNull, gte, or }) =>
            and(lte(table.startAt, now), or(isNull(table.endAt), gte(table.endAt, now))),
        },
      },
    })

    // for now I want to get:
    // - new signups in the current billing period
    // - total revenue in the current billing period
    // - subscriptions churn in the current billing period
    // - number of active plans in the current billing period

    // # TODO: basic calculation, this should come from the analytics service
    const defaultDineroCurrency = currencies[opts.ctx.project.defaultCurrency]

    let total = dinero({ amount: 0, currency: defaultDineroCurrency })

    // TODO: this should come from the analytics service
    // basic calculations for now
    const stats = {
      newSignups: {
        total: 0,
        title: "New Signups",
        description: "New signups last 30 days",
      },
      totalRevenue: {
        total: 0,
        title: "Total Revenue",
        description: "Total revenue last 30 days",
        unit: currencySymbol(opts.ctx.project.defaultCurrency),
      },
      newSubscriptions: {
        total: 0,
        title: "New Subscriptions",
        description: "New subscriptions last 30 days",
      },
      newCustomers: {
        total: 0,
        title: "New Customers",
        description: "New customers last 30 days",
      },
    }

    for (const subscription of data) {
      const planVersion = subscription.phases[0]?.planVersion

      if (!planVersion) {
        continue
      }

      const { err, val } = calculateFlatPricePlan({
        planVersion,
        prorate: 1,
      })

      if (err) {
        console.error(err)
        continue
      }

      const price = val.dinero

      stats.newSignups.total += 1
      total = add(total, price)
      stats.newSubscriptions.total += 1
      stats.newCustomers.total += 1
    }

    const displayAmount = toDecimal(total, ({ value }) => Number(value))
    stats.totalRevenue.total = displayAmount

    return {
      stats,
    }
  })
