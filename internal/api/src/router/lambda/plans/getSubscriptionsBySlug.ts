import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { and, desc, eq, getTableColumns } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import {
  customerSelectSchema,
  planSelectBaseSchema,
  projectExtendedSelectSchema,
  subscriptionSelectSchema,
} from "@unprice/db/validators"

import { protectedProjectProcedure } from "../../../trpc"

export const getSubscriptionsBySlug = protectedProjectProcedure
  .input(z.object({ slug: z.string() }))
  .output(
    z.object({
      plan: planSelectBaseSchema,
      subscriptions: subscriptionSelectSchema
        .extend({
          customer: customerSelectSchema,
        })
        .array(),
      project: projectExtendedSelectSchema,
    })
  )
  .query(async (opts) => {
    const { slug } = opts.input
    const project = opts.ctx.project
    const customerColumns = getTableColumns(schema.customers)

    const plan = await opts.ctx.db.query.plans.findFirst({
      where: (plan, { eq, and }) => and(eq(plan.slug, slug), eq(plan.projectId, project.id)),
    })

    if (!plan) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Plan not found",
      })
    }

    const planWithSubscriptions = await opts.ctx.db
      .select({
        subscriptions: schema.subscriptions,
        customer: customerColumns,
      })
      .from(schema.subscriptions)
      .innerJoin(
        schema.customers,
        and(
          eq(schema.subscriptions.customerId, schema.customers.id),
          eq(schema.customers.projectId, schema.subscriptions.projectId)
        )
      )
      .innerJoin(
        schema.subscriptionPhases,
        and(
          eq(schema.subscriptionPhases.subscriptionId, schema.subscriptions.id),
          eq(schema.subscriptionPhases.projectId, schema.subscriptions.projectId)
        )
      )
      .innerJoin(
        schema.versions,
        and(
          eq(schema.subscriptionPhases.planVersionId, schema.versions.id),
          eq(schema.subscriptionPhases.projectId, schema.versions.projectId)
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
        project: project,
        subscriptions: [],
      }
    }

    const subscriptions = planWithSubscriptions.map((data) => {
      return {
        ...data.subscriptions,
        customer: data.customer,
      }
    })

    return {
      plan: plan,
      project: project,
      subscriptions: subscriptions,
    }
  })
