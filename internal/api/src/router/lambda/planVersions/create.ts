import { TRPCError } from "@trpc/server"
import { and, eq, sql } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import * as utils from "@unprice/db/utils"
import { planVersionSelectBaseSchema, versionInsertBaseSchema } from "@unprice/db/validators"
import { z } from "zod"
import { protectedProjectProcedure } from "../../../trpc"

export const create = protectedProjectProcedure
  .input(versionInsertBaseSchema)
  .output(
    z.object({
      planVersion: planVersionSelectBaseSchema,
    })
  )
  .mutation(async (opts) => {
    const {
      planId,
      metadata,
      description,
      currency,
      billingPeriod,
      startCycle,
      gracePeriod,
      title,
      tags,
      whenToBill,
      status,
      paymentProvider,
      planType,
    } = opts.input
    const project = opts.ctx.project

    // only owner and admin can create a plan version
    opts.ctx.verifyRole(["OWNER", "ADMIN"])

    const planData = await opts.ctx.db.query.plans.findFirst({
      where: (plan, { eq, and }) => and(eq(plan.id, planId), eq(plan.projectId, project.id)),
    })

    if (!planData?.id) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "plan not found",
      })
    }

    const planVersionId = utils.newId("plan_version")

    // this should happen in a transaction because we need to change the status of the previous version
    const planVersionData = await opts.ctx.db.transaction(async (tx) => {
      try {
        // get the count of versions for this plan
        const countVersionsPlan = await tx
          .select({ count: sql<number>`count(*)` })
          .from(schema.versions)
          .where(and(eq(schema.versions.projectId, project.id), eq(schema.versions.planId, planId)))
          .then((res) => res[0]?.count ?? 0)

        const planVersionData = await tx
          .insert(schema.versions)
          .values({
            id: planVersionId,
            planId,
            projectId: project.id,
            description,
            title: title ?? planData.slug,
            tags: tags ?? [],
            status: status ?? "draft",
            paymentProvider,
            planType,
            currency,
            billingPeriod: billingPeriod ?? "month",
            startCycle: startCycle ?? "first_day_of_month",
            gracePeriod: gracePeriod ?? 0,
            whenToBill: whenToBill ?? "pay_in_advance",
            metadata,
            version: Number(countVersionsPlan) + 1,
          })
          .returning()
          .catch((err) => {
            console.error(err)
            tx.rollback()
            throw err
          })
          .then((re) => re[0])

        if (!planVersionData?.id) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "error creating version",
          })
        }

        return planVersionData
      } catch (error) {
        if (error instanceof Error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          })
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "error creating version",
        })
      }
    })

    return {
      planVersion: planVersionData,
    }
  })
