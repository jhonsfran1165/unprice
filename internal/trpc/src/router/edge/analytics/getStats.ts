import * as currencies from "@dinero.js/currencies"

import { formatMoney } from "@unprice/db/utils"
import { calculateFlatPricePlan } from "@unprice/db/validators"
import { add, dinero, toDecimal } from "dinero.js"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"

export const getStats = protectedProjectProcedure
  .input(z.void())
  .output(
    z.object({
      stats: z.object({
        newSignups: z.number(),
        totalRevenue: z.string(),
        newSubscriptions: z.number(),
        newCustomers: z.number(),
      }),
    })
  )
  .query(async (opts) => {
    const projectId = opts.ctx.project.id
    const now = Date.now()

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
      newSignups: 0,
      totalRevenue: "",
      newSubscriptions: 0,
      newCustomers: 0,
    }

    for (const subscription of data) {
      const planVersion = subscription.phases[0]!.planVersion

      const { err, val } = calculateFlatPricePlan({
        planVersion,
        prorate: 1,
      })

      if (err) {
        console.error(err)
        continue
      }

      const price = val.dinero

      stats.newSignups += 1
      total = add(total, price)
      stats.newSubscriptions += 1
      stats.newCustomers += 1
    }

    const displayAmount = toDecimal(
      total,
      ({ value, currency }) => `${formatMoney(value, currency.code)}`
    )

    return {
      stats: {
        ...stats,
        totalRevenue: displayAmount,
      },
    }
  })
