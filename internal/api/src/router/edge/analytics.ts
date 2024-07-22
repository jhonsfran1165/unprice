import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { monthsSchema, yearsSchema } from "@unprice/db/validators"

import { createTRPCRouter, protectedApiOrActiveProjectProcedure } from "../../trpc"

export const analyticsRouter = createTRPCRouter({
  // encodeURIComponent(JSON.stringify({ 0: { json:{ year: 2024, month: 6}}}))
  getUsageAllFeatureActiveProject: protectedApiOrActiveProjectProcedure
    .input(
      z.object({
        year: yearsSchema,
        month: monthsSchema,
      })
    )
    .query(async (opts) => {
      const project = opts.ctx.project
      const { year, month } = opts.input

      const start = new Date(year, month - 1, 1).getTime()
      const end = new Date(year, month).getTime()

      const usage = await opts.ctx.analytics
        .getUsageAllFeaturesProject({
          projectId: project.id,
          start: start,
          end: end,
        })
        .then((res) => res.data)

      if (!usage) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "You are not subscribed to this workspace",
        })
      }

      // // get all features configured for the project
      // const featuresPlanVersion =

      return {
        usage: usage,
      }
    }),
  getAllFeatureVerificationsActiveProject: protectedApiOrActiveProjectProcedure
    .input(
      z.object({
        year: yearsSchema,
        month: monthsSchema,
      })
    )
    .query(async (opts) => {
      const project = opts.ctx.project
      const { year, month } = opts.input

      const start = new Date(year, month - 1, 1).getTime()
      const end = new Date(year, month).getTime()

      const verifications = await opts.ctx.analytics
        .getFeaturesVerifications({
          projectId: project.id,
          start: start,
          end: end,
        })
        .then((res) => res.data)

      if (!verifications) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "You are not subscribed to this workspace",
        })
      }

      // // get all features configured for the project
      // const featuresPlanVersion =

      return {
        verifications: verifications,
      }
    }),
})
