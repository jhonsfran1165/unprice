import { TRPCError } from "@trpc/server"
import { z } from "zod"

import {
  planVersionExtendedSchema,
  subscriptionPhaseExtendedSchema,
  subscriptionSelectSchema,
} from "@unprice/db/validators"

import { protectedWorkspaceProcedure } from "#trpc"

export const mySubscriptions = protectedWorkspaceProcedure
  .input(z.void())
  .output(
    z.object({
      subscriptions: subscriptionSelectSchema
        .extend({
          phases: subscriptionPhaseExtendedSchema
            .extend({
              planVersion: planVersionExtendedSchema,
            })
            .array(),
        })
        .array(),
      customerId: z.string(),
    })
  )
  .query(async (opts) => {
    const workspace = opts.ctx.workspace
    const customerId = workspace.unPriceCustomerId

    if (!customerId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You are not a customer of this workspace",
      })
    }

    const customerData = await opts.ctx.db.query.customers.findFirst({
      with: {
        subscriptions: {
          with: {
            phases: {
              with: {
                planVersion: {
                  with: {
                    plan: true,
                    planFeatures: {
                      with: {
                        feature: true,
                      },
                    },
                  },
                },
                items: {
                  with: {
                    featurePlanVersion: {
                      with: {
                        feature: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: (subscription, { desc }) => [desc(subscription.createdAtM)],
          where: (subscription, { eq }) => eq(subscription.active, true),
        },
      },
      where: (customer, { eq }) => eq(customer.id, customerId),
    })

    if (!customerData) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "You are not subscribed to this workspace",
      })
    }

    return {
      subscriptions: customerData.subscriptions,
      customerId: customerData.id,
    }
  })
