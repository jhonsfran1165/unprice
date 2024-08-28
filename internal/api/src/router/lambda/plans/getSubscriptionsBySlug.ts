import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { type Database, and, desc, eq, getTableColumns } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { planSelectBaseSchema, subscriptionExtendedWithItemsSchema } from "@unprice/db/validators"

import { protectedProjectProcedure } from "../../../trpc"

import { buildItemsBySubscriptionIdQuery } from "../../../queries/subscriptions"

export const getSubscriptionsBySlug = protectedProjectProcedure
  .input(z.object({ slug: z.string() }))
  .output(
    z.object({
      plan: planSelectBaseSchema,
      subscriptions: subscriptionExtendedWithItemsSchema.array(),
    })
  )
  .query(async (opts) => {
    const { slug } = opts.input
    const project = opts.ctx.project
    const customerColumns = getTableColumns(schema.customers)
    const versionColumns = getTableColumns(schema.versions)

    const plan = await opts.ctx.db.query.plans.findFirst({
      where: (plan, { eq, and }) => and(eq(plan.slug, slug), eq(plan.projectId, project.id)),
    })

    if (!plan) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Plan not found",
      })
    }

    const items = await buildItemsBySubscriptionIdQuery({
      db: opts.ctx.db as Database,
    })

    const planWithSubscriptions = await opts.ctx.db
      .with(items)
      .select({
        subscriptions: schema.subscriptions,
        customer: customerColumns,
        version: versionColumns,
        items: items.items,
      })
      .from(schema.subscriptions)
      .innerJoin(
        schema.customers,
        and(
          eq(schema.subscriptions.customerId, schema.customers.id),
          eq(schema.customers.projectId, schema.subscriptions.projectId)
        )
      )
      .leftJoin(
        items,
        and(
          eq(items.subscriptionId, schema.subscriptions.id),
          eq(items.projectId, schema.subscriptions.projectId)
        )
      )
      .innerJoin(
        schema.versions,
        and(
          eq(schema.subscriptions.planVersionId, schema.versions.id),
          eq(schema.customers.projectId, schema.versions.projectId),
          eq(schema.versions.projectId, project.id)
        )
      )
      .innerJoin(
        schema.plans,
        and(
          eq(schema.versions.planId, schema.plans.id),
          eq(schema.plans.projectId, schema.versions.projectId)
        )
      )
      .where(and(eq(schema.plans.slug, slug), eq(schema.plans.projectId, project.id)))
      .orderBy(() => [desc(schema.subscriptions.createdAtM)])

    if (!planWithSubscriptions || !planWithSubscriptions.length) {
      return {
        plan: plan,
        subscriptions: [],
      }
    }

    const subscriptions = planWithSubscriptions.map((data) => {
      return {
        ...data.subscriptions,
        items: data.items,
        customer: data.customer,
        version: data.version,
        // subscriptionItems: data.subscriptionItems,
      }
    })

    return {
      plan: plan,
      subscriptions: subscriptions,
    }
  })
