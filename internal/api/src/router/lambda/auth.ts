import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { planVersionSelectBaseSchema, subscriptionSelectSchema } from "@unprice/db/validators"

import {
  createTRPCRouter,
  protectedActiveWorkspaceOwnerProcedure,
  protectedProcedure,
} from "../../trpc"

export const authRouter = createTRPCRouter({
  // TODO: this should query the user's active subscriptions
  mySubscriptions: protectedActiveWorkspaceOwnerProcedure
    .input(z.void())
    .output(
      z.object({
        subscriptions: subscriptionSelectSchema
          .extend({
            planVersion: planVersionSelectBaseSchema,
          })
          .array(),
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
              planVersion: true,
            },
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
      }
    }),
  listOrganizations: protectedProcedure.query(async (opts) => {
    const userId = opts.ctx.userId

    const memberships = await opts.ctx.db.query.members.findMany({
      with: {
        workspace: {
          columns: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true,
            isPersonal: true,
          },
        },
      },
      where: (members, operators) => operators.eq(members.userId, userId),
      orderBy: (members) => members.createdAtM,
    })

    return memberships.map((members) => ({
      id: members.workspace.id,
      slug: members.workspace.slug,
      name: members.workspace.name,
      image: members.workspace.imageUrl,
    }))
  }),
})
