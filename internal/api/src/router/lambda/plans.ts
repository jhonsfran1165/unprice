import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { and, desc, eq, getTableColumns, sql } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import * as utils from "@unprice/db/utils"
import {
  planInsertBaseSchema,
  planSelectBaseSchema,
  planVersionSelectBaseSchema,
  projectSelectBaseSchema,
  subscriptionExtendedWithItemsSchema,
} from "@unprice/db/validators"

import {
  createTRPCRouter,
  protectedActiveProjectAdminProcedure,
  protectedActiveProjectProcedure,
} from "../../trpc"

import { buildItemsBySubscriptionIdQuery } from "../../queries/subscriptions"

export const planRouter = createTRPCRouter({
  create: protectedActiveProjectProcedure
    .input(planInsertBaseSchema)
    .output(
      z.object({
        plan: planSelectBaseSchema,
      })
    )
    .mutation(async (opts) => {
      const { slug, description, defaultPlan, enterprisePlan } = opts.input
      const project = opts.ctx.project

      const planId = utils.newId("plan")

      if (defaultPlan && enterprisePlan) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A plan cannot be both a default and enterprise plan",
        })
      }

      if (defaultPlan) {
        const defaultPlanData = await opts.ctx.db.query.plans.findFirst({
          where: (plan, { eq, and }) =>
            and(eq(plan.projectId, project.id), eq(plan.defaultPlan, true)),
        })

        if (defaultPlanData?.id) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "There is already a default plan for this project",
          })
        }
      }

      if (enterprisePlan) {
        const enterprisePlanData = await opts.ctx.db.query.plans.findFirst({
          where: (plan, { eq, and }) =>
            and(eq(plan.projectId, project.id), eq(plan.enterprisePlan, true)),
        })

        if (enterprisePlanData?.id) {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "There is already an enterprise plan for this project, create a new version instead",
          })
        }
      }

      const planData = await opts.ctx.db
        .insert(schema.plans)
        .values({
          id: planId,
          slug,
          projectId: project.id,
          description,
          active: true,
          defaultPlan: defaultPlan ?? false,
          enterprisePlan: enterprisePlan ?? false,
        })
        .returning()
        .then((planData) => {
          return planData[0]
        })

      if (!planData?.id) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "error creating plan",
        })
      }

      return {
        plan: planData,
      }
    }),

  remove: protectedActiveProjectProcedure
    .input(planSelectBaseSchema.pick({ id: true }))
    .output(z.object({ plan: planSelectBaseSchema }))
    .mutation(async (opts) => {
      const { id } = opts.input
      const project = opts.ctx.project

      const countVersionsPlan = await opts.ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.versions)
        .where(and(eq(schema.versions.projectId, project.id), eq(schema.versions.planId, id)))
        .then((res) => res[0]?.count ?? 0)

      if (countVersionsPlan > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You cannot delete a plan that has versions. Please deactivate it instead",
        })
      }

      const deletedPlan = await opts.ctx.db
        .delete(schema.plans)
        .where(and(eq(schema.plans.projectId, project.id), eq(schema.plans.id, id)))
        .returning()
        .then((data) => data[0])

      if (!deletedPlan) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error deleting plan",
        })
      }

      return {
        plan: deletedPlan,
      }
    }),
  update: protectedActiveProjectAdminProcedure
    .input(planInsertBaseSchema.required({ id: true }))
    .output(
      z.object({
        plan: planSelectBaseSchema,
      })
    )
    .mutation(async (opts) => {
      const { id, description, active, defaultPlan, enterprisePlan } = opts.input
      const project = opts.ctx.project

      if (defaultPlan && enterprisePlan) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A plan cannot be both a default and enterprise plan",
        })
      }

      const planData = await opts.ctx.db.query.plans.findFirst({
        with: {
          project: {
            columns: {
              slug: true,
            },
          },
        },
        where: (plan, { eq, and }) => and(eq(plan.id, id), eq(plan.projectId, project.id)),
      })

      if (!planData?.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "plan not found",
        })
      }

      if (defaultPlan) {
        const defaultPlanData = await opts.ctx.db.query.plans.findFirst({
          where: (plan, { eq, and }) =>
            and(eq(plan.projectId, project.id), eq(plan.defaultPlan, true)),
        })

        if (defaultPlanData && defaultPlanData.id !== id) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "There is already a default plan for this project",
          })
        }
      }

      if (enterprisePlan) {
        const enterprisePlanData = await opts.ctx.db.query.plans.findFirst({
          where: (plan, { eq, and }) =>
            and(eq(plan.projectId, project.id), eq(plan.enterprisePlan, true)),
        })

        if (enterprisePlanData && enterprisePlanData.id !== id) {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "There is already an enterprise plan for this project, create a new version instead",
          })
        }
      }

      // TODO: is it a good idea to let the user update the plan?
      // maybe we should think what happen if the user update the plan and there are versions
      // that are not compatible with the new plan. This is also a good reason to have a version as a snapshot
      // in the subscription so the customer can keep using the old version no matter what happens with the plan

      const updatedPlan = await opts.ctx.db
        .update(schema.plans)
        .set({
          description,
          active,
          defaultPlan: defaultPlan ?? false,
          enterprisePlan: enterprisePlan ?? false,
          updatedAtM: Date.now(),
        })
        .where(and(eq(schema.plans.id, id), eq(schema.plans.projectId, project.id)))
        .returning()
        .then((re) => re[0])

      if (!updatedPlan) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error updating plan",
        })
      }

      return {
        plan: updatedPlan,
      }
    }),

  exist: protectedActiveProjectProcedure
    .input(z.object({ slug: z.string(), id: z.string().optional() }))
    .output(
      z.object({
        exist: z.boolean(),
      })
    )
    .mutation(async (opts) => {
      const { slug, id } = opts.input
      const project = opts.ctx.project

      const plan = await opts.ctx.db.query.plans.findFirst({
        columns: {
          id: true,
        },
        where: (plan, { eq, and }) =>
          id
            ? and(eq(plan.projectId, project.id), eq(plan.id, id))
            : and(eq(plan.projectId, project.id), eq(plan.slug, slug)),
      })

      return {
        exist: !!plan,
      }
    }),
  getBySlug: protectedActiveProjectProcedure
    .input(z.object({ slug: z.string() }))
    .output(
      z.object({
        plan: planSelectBaseSchema,
      })
    )
    .query(async (opts) => {
      const { slug } = opts.input
      const project = opts.ctx.project

      const plan = await opts.ctx.db.query.plans.findFirst({
        where: (plan, { eq, and }) => and(eq(plan.slug, slug), eq(plan.projectId, project.id)),
      })

      if (!plan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Plan not found",
        })
      }

      return {
        plan: plan,
      }
    }),
  getVersionsBySlug: protectedActiveProjectProcedure
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
    }),
  getSubscriptionsBySlug: protectedActiveProjectProcedure
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
        db: opts.ctx.db,
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
    }),
  getById: protectedActiveProjectProcedure
    .input(z.object({ id: z.string() }))
    .output(
      z.object({
        plan: planSelectBaseSchema.extend({
          versions: z.array(planVersionSelectBaseSchema),
          project: projectSelectBaseSchema,
        }),
      })
    )
    .query(async (opts) => {
      const { id } = opts.input
      const project = opts.ctx.project

      const plan = await opts.ctx.db.query.plans.findFirst({
        with: {
          versions: {
            orderBy: (version, { desc }) => [desc(version.createdAtM)],
          },
          project: true,
        },
        where: (plan, { eq, and }) => and(eq(plan.id, id), eq(plan.projectId, project.id)),
      })

      if (!plan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Plan not found",
        })
      }

      return {
        plan: plan,
      }
    }),

  listByActiveProject: protectedActiveProjectProcedure
    .input(
      z.object({
        fromDate: z.number().optional(),
        toDate: z.number().optional(),
        published: z.boolean().optional(),
        active: z.boolean().optional(),
      })
    )
    .output(
      z.object({
        plans: z.array(
          planSelectBaseSchema.extend({
            versions: z.array(
              planVersionSelectBaseSchema.pick({
                id: true,
                status: true,
                title: true,
                currency: true,
                version: true,
              })
            ),
          })
        ),
      })
    )
    .query(async (opts) => {
      const { fromDate, toDate, published, active } = opts.input
      const project = opts.ctx.project

      const needsPublished = published === undefined || published
      const needsActive = active === undefined || active

      const plans = await opts.ctx.db.query.plans.findMany({
        with: {
          versions: {
            where: (version, { eq }) =>
              // get published versions by default, only get unpublished versions if the user wants it
              needsPublished ? eq(version.status, "published") : undefined,
            orderBy: (version, { desc }) => [desc(version.createdAtM)],
            columns: {
              status: true,
              id: true,
              title: true,
              currency: true,
              version: true,
            },
          },
        },
        where: (plan, { eq, and, between, gte, lte }) =>
          and(
            eq(plan.projectId, project.id),
            fromDate && toDate ? between(plan.createdAtM, fromDate, toDate) : undefined,
            fromDate ? gte(plan.createdAtM, fromDate) : undefined,
            toDate ? lte(plan.createdAtM, toDate) : undefined,
            // get active versions by default, only get inactive versions if the user wants it
            needsActive ? eq(plan.active, true) : undefined
          ),
      })

      return {
        plans,
      }
    }),
})
