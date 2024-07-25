import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { createTRPCRouter, protectedApiOrActiveProjectProcedure } from "../../trpc"

export const analyticsRouter = createTRPCRouter({
  // encodeURIComponent(JSON.stringify({ 0: { json:{ year: 2024, month: 6}}}))
  getTotalUsagePerFeatureActiveProject: protectedApiOrActiveProjectProcedure
    .input(
      z.object({
        start: z.number(),
        end: z.number(),
      })
    )
    .query(async (opts) => {
      const project = opts.ctx.project
      const { start, end } = opts.input

      const usage = await opts.ctx.analytics
        .getTotalUsagePerProject({
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
        start: z.number(),
        end: z.number(),
      })
    )
    .query(async (opts) => {
      const project = opts.ctx.project
      const { start, end } = opts.input

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
