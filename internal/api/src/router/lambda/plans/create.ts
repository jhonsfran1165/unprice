import { TRPCError } from "@trpc/server"
import { z } from "zod"

import * as schema from "@unprice/db/schema"
import * as utils from "@unprice/db/utils"
import { planInsertBaseSchema, planSelectBaseSchema } from "@unprice/db/validators"

import { protectedProjectProcedure } from "../../../trpc"

export const create = protectedProjectProcedure
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
  })