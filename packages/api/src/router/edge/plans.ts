import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { and, eq, sql } from "@builderai/db"
import * as schema from "@builderai/db/schema"
import * as utils from "@builderai/db/utils"
import {
  planInsertBaseSchema,
  planSelectBaseSchema,
  planVersionSelectBaseSchema,
  projectSelectBaseSchema,
} from "@builderai/db/validators"

import {
  createTRPCRouter,
  protectedActiveProjectAdminProcedure,
  protectedActiveProjectProcedure,
} from "../../trpc"

export const planRouter = createTRPCRouter({
  create: protectedActiveProjectProcedure
    .input(planInsertBaseSchema)
    .output(
      z.object({
        plan: planSelectBaseSchema,
      })
    )
    .mutation(async (opts) => {
      const { slug, description } = opts.input
      const project = opts.ctx.project

      const planId = utils.newId("plan")

      const planData = await opts.ctx.db
        .insert(schema.plans)
        .values({
          id: planId,
          slug,
          projectId: project.id,
          description,
          active: true,
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
        .where(
          and(
            eq(schema.versions.projectId, project.id),
            eq(schema.versions.planId, id)
          )
        )
        .then((res) => res[0]?.count ?? 0)

      if (countVersionsPlan > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "You cannot delete a plan that has versions. Please deactivate it instead",
        })
      }

      const deletedPlan = await opts.ctx.db
        .delete(schema.plans)
        .where(
          and(eq(schema.plans.projectId, project.id), eq(schema.plans.id, id))
        )
        .returning()
        .then((data) => data[0])

      if (!deletedPlan) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error deleting feature",
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
      const { id, description, active } = opts.input
      const project = opts.ctx.project

      const planData = await opts.ctx.db.query.plans.findFirst({
        with: {
          project: {
            columns: {
              slug: true,
            },
          },
        },
        where: (plan, { eq, and }) =>
          and(eq(plan.id, id), eq(plan.projectId, project.id)),
      })

      if (!planData?.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "plan not found",
        })
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
          updatedAt: new Date(),
        })
        .where(
          and(eq(schema.plans.id, id), eq(schema.plans.projectId, project.id))
        )
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
        plan: planSelectBaseSchema.extend({
          versions: z.array(planVersionSelectBaseSchema),
          project: projectSelectBaseSchema,
        }),
      })
    )
    .query(async (opts) => {
      const { slug } = opts.input
      const project = opts.ctx.project

      const plan = await opts.ctx.db.query.plans.findFirst({
        with: {
          versions: {
            orderBy: (version, { desc }) => [desc(version.createdAt)],
          },
          project: true,
        },
        where: (plan, { eq, and }) =>
          and(eq(plan.slug, slug), eq(plan.projectId, project.id)),
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
            orderBy: (version, { desc }) => [desc(version.createdAt)],
          },
          project: true,
        },
        where: (plan, { eq, and }) =>
          and(eq(plan.id, id), eq(plan.projectId, project.id)),
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
              })
            ),
          })
        ),
      })
    )
    .query(async (opts) => {
      const { fromDate, toDate } = opts.input
      const project = opts.ctx.project

      const plans = await opts.ctx.db.query.plans.findMany({
        with: {
          versions: {
            orderBy: (version, { desc }) => [desc(version.createdAt)],
            columns: {
              status: true,
              id: true,
            },
          },
        },
        where: (plan, { eq, and, between, gte, lte }) =>
          and(
            eq(plan.projectId, project.id),
            fromDate && toDate
              ? between(plan.createdAt, new Date(fromDate), new Date(toDate))
              : undefined,
            fromDate ? gte(plan.createdAt, new Date(fromDate)) : undefined,
            toDate ? lte(plan.createdAt, new Date(toDate)) : undefined
          ),
      })

      return {
        plans,
      }
    }),
})
