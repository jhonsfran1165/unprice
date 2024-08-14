import { TRPCError } from "@trpc/server"
import { and, count, eq, getTableColumns } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import {
  type Subscription,
  customerSelectSchema,
  planVersionSelectBaseSchema,
  searchParamsSchemaDataTable,
  subscriptionInsertSchema,
  subscriptionSelectSchema,
} from "@unprice/db/validators"
import { z } from "zod"

import { withDateFilters, withPagination } from "@unprice/db/utils"
import { addDays, format } from "date-fns"
import {
  createTRPCRouter,
  protectedActiveProjectAdminProcedure,
  protectedActiveProjectProcedure,
} from "../../trpc"
import { createSubscription } from "../../utils/shared"

export const subscriptionRouter = createTRPCRouter({
  create: protectedActiveProjectAdminProcedure
    .input(subscriptionInsertSchema)
    .output(
      z.object({
        subscription: subscriptionSelectSchema,
      })
    )
    .mutation(async (opts) => {
      const { subscription } = await createSubscription({
        subscription: opts.input,
        project: opts.ctx.project,
        ctx: opts.ctx,
      })

      return {
        subscription: subscription,
      }
    }),

  listByActiveProject: protectedActiveProjectProcedure
    .input(searchParamsSchemaDataTable)
    .output(
      z.object({
        subscriptions: subscriptionSelectSchema
          .extend({
            customer: customerSelectSchema,
            version: planVersionSelectBaseSchema,
          })
          .array(),
        pageCount: z.number(),
      })
    )
    .query(async (opts) => {
      const { page, page_size, from, to } = opts.input
      const project = opts.ctx.project
      const columns = getTableColumns(schema.subscriptions)
      const customerColumns = getTableColumns(schema.customers)
      const versionColumns = getTableColumns(schema.versions)

      try {
        const expressions = [
          // Filter by project
          eq(columns.projectId, project.id),
        ]

        // Transaction is used to ensure both queries are executed in a single transaction
        const { data, total } = await opts.ctx.db.transaction(async (tx) => {
          const query = tx
            .select({
              subscriptions: schema.subscriptions,
              customer: customerColumns,
              version: versionColumns,
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
              schema.versions,
              and(
                eq(schema.subscriptions.planVersionId, schema.versions.id),
                eq(schema.customers.projectId, schema.versions.projectId),
                eq(schema.versions.projectId, project.id)
              )
            )
            .$dynamic()

          const whereQuery = withDateFilters<Subscription>(expressions, columns.createdAt, from, to)

          const data = await withPagination(
            query,
            whereQuery,
            [
              {
                column: columns.createdAt,
                order: "desc",
              },
            ],
            page,
            page_size
          )

          const total = await tx
            .select({
              count: count(),
            })
            .from(schema.subscriptions)
            .where(whereQuery)
            .execute()
            .then((res) => res[0]?.count ?? 0)

          const subscriptions = data.map((data) => {
            return {
              ...data.subscriptions,
              customer: data.customer,
              version: data.version,
            }
          })

          return {
            data: subscriptions,
            total,
          }
        })

        const pageCount = Math.ceil(total / page_size)
        return { subscriptions: data, pageCount }
      } catch (err: unknown) {
        console.error(err)
        return { subscriptions: [], pageCount: 0 }
      }
    }),
  listByPlanVersion: protectedActiveProjectProcedure
    .input(
      subscriptionSelectSchema.pick({
        planVersionId: true,
      })
    )
    .output(
      z.object({
        subscriptions: z.array(subscriptionSelectSchema),
      })
    )
    .query(async (opts) => {
      const { planVersionId } = opts.input
      const project = opts.ctx.project

      const subscriptionData = await opts.ctx.db.query.subscriptions.findMany({
        where: (subscription, { eq, and }) =>
          and(
            eq(subscription.projectId, project.id),
            eq(subscription.planVersionId, planVersionId)
          ),
      })

      if (!subscriptionData || subscriptionData.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subscription not found. Please check the planVersionId",
        })
      }

      return {
        subscriptions: subscriptionData,
      }
    }),
  changePlan: protectedActiveProjectAdminProcedure
    .input(
      subscriptionInsertSchema
        .extend({
          endDate: z.coerce.date(),
          nextPlanVersionTo: z.string(),
        })
        .required({
          id: true,
          endDate: true,
          customerId: true,
          nextPlanVersionTo: true,
        })
    )
    .output(z.object({ result: z.boolean(), message: z.string() }))
    .mutation(async (opts) => {
      const {
        id: subscriptionId,
        customerId,
        endDate,
        nextPlanVersionTo,
        collectionMethod,
        type,
        defaultPaymentMethodId,
        autoRenew,
        trialDays,
      } = opts.input
      const project = opts.ctx.project

      const subscriptionData = await opts.ctx.db.query.subscriptions.findFirst({
        with: {
          customer: true,
          planVersion: {
            with: {
              plan: true,
            },
          },
        },
        where: (subscription, { eq, and }) =>
          and(
            eq(subscription.id, subscriptionId),
            eq(subscription.projectId, project.id),
            eq(subscription.customerId, customerId)
          ),
      })

      if (!subscriptionData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subscription not found. Please check the id and customerId",
        })
      }

      if (subscriptionData.status === "inactive") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Subscription is already inactive",
        })
      }

      if (subscriptionData.status === "ended") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Subscription is already ended",
        })
      }

      if (subscriptionData.planVersion.id === nextPlanVersionTo) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot change the subscription for the same plan version.",
        })
      }

      // if the customer has trials left we should not let the customer change the subscription until the trial ends
      if (subscriptionData?.trialEndsAt && subscriptionData.trialEndsAt > new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `The customer has a trial until ${format(
            subscriptionData.trialEndsAt,
            "yyyy-MM-dd"
          )}. Please set the endDate after the trial ends`,
        })
      }

      // if the subscription was changed in the last 30 days, we should not allow the customer to change the plan
      if (
        subscriptionData.planChangedAt &&
        subscriptionData.planChangedAt > addDays(new Date(), -30)
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "You cannot change the plan version, this subscription was changed in the last 30 days.",
        })
      }

      // end date must be after the start date
      if (endDate < subscriptionData.startDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "End date must be after start date",
        })
      }

      // if there is no planVersionId provided, we downgrade the customer to the default plan
      const newPlanVersion = await opts.ctx.db.query.versions.findFirst({
        where: (version, { eq, and }) =>
          and(
            eq(version.id, nextPlanVersionTo),
            eq(version.projectId, project.id),
            eq(version.status, "published"),
            eq(version.currency, subscriptionData.customer.defaultCurrency)
          ),
      })

      if (!newPlanVersion) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "New plan version not found",
        })
      }

      // 1. update the subscription to inactive
      // 2. set the planVersionDowngradeTo, endDate and planChanged and nextSubscriptionId
      // 3. create a new subscription with the default plan version
      // 4. set the new subscription as the nextSubscriptionId

      const newSubscription = await opts.ctx.db.transaction(async (trx) => {
        // end the current subscription
        const subscription = await trx
          .update(schema.subscriptions)
          .set({
            status: "ended",
            endDate: endDate,
            nextPlanVersionTo: newPlanVersion.id,
            planChangedAt: new Date(),
          })
          .where(
            and(
              eq(schema.subscriptions.id, subscriptionId),
              eq(schema.subscriptions.projectId, project.id),
              eq(schema.subscriptions.customerId, customerId)
            )
          )
          .returning()
          .then((re) => re[0])

        if (!subscription) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Error ending subscription",
          })
        }

        // create a new subscription
        const { subscription: newSubscription } = await createSubscription({
          subscription: {
            customerId: customerId,
            planVersionId: newPlanVersion.id,
            projectId: project.id,
            collectionMethod: collectionMethod ?? subscriptionData.collectionMethod,
            startDate: addDays(endDate, 1),
            endDate: undefined,
            autoRenew: autoRenew ?? subscriptionData.autoRenew,
            isNew: true,
            defaultPaymentMethodId:
              defaultPaymentMethodId ?? subscriptionData.defaultPaymentMethodId,
            trialDays: trialDays ?? 0,
            type: type ?? subscriptionData.type,
            planChangedAt: new Date(),
          },
          project: opts.ctx.project,
          ctx: opts.ctx,
        })

        // set the new subscription as the nextSubscriptionId
        await trx
          .update(schema.subscriptions)
          .set({
            nextSubscriptionId: newSubscription.id,
          })
          .where(
            and(
              eq(schema.subscriptions.id, subscriptionId),
              eq(schema.subscriptions.projectId, project.id),
              eq(schema.subscriptions.customerId, customerId)
            )
          )

        return newSubscription
      })

      if (!newSubscription) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error changing plan",
        })
      }

      return {
        result: true,
        message: "Subscription changed successfully",
      }
    }),
})
