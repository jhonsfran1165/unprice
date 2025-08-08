import {
  type Analytics,
  type AnalyticsEventAction,
  schemaPageHit,
  schemaPlanClick,
  schemaSignUp,
} from "@unprice/analytics"
import { z } from "zod"
import { protectedProjectProcedure } from "#trpc"

export const getLatestEvents = protectedProjectProcedure
  .input(z.custom<Parameters<Analytics["getLatestEvents"]>[0]>())
  .output(
    z.object({
      data: z
        .object({
          timestamp: z.coerce.date(),
          name: z.string(),
          action: z.custom<AnalyticsEventAction>(),
          session_id: z.string(),
          description: z.string(),
        })
        .array(),
      projectId: z.string(),
    })
  )
  .query(async (opts) => {
    const { action, interval_days } = opts.input
    const projectId = opts.ctx.project.id

    const data = await opts.ctx.analytics
      .getLatestEvents({
        action,
        interval_days,
        project_id: projectId,
      })
      .catch((err) => {
        opts.ctx.logger.error("Failed to get latest events", {
          error: err.message,
        })

        return { data: [] }
      })

    const result = data.data.map((event) => {
      switch (event.action) {
        case "plan_click": {
          const payload = schemaPlanClick.parse(JSON.parse(event.payload))
          return {
            action: event.action as AnalyticsEventAction,
            timestamp: event.timestamp,
            session_id: event.session_id,
            name: "Plan clicked",
            description: `Plan clicked ${payload.plan_version_id}`,
          }
        }
        case "page_hit": {
          const payload = schemaPageHit.parse(JSON.parse(event.payload))
          return {
            action: event.action as AnalyticsEventAction,
            timestamp: event.timestamp,
            session_id: event.session_id,
            name: "Page hit",
            description: `Page hit ${payload.pathname}`,
          }
        }
        case "signup": {
          const payload = schemaSignUp.parse(JSON.parse(event.payload))
          return {
            action: event.action as AnalyticsEventAction,
            timestamp: event.timestamp,
            session_id: event.session_id,
            name: "Signup",
            description: `Signup ${payload.customer_id}`,
          }
        }
        default: {
          return {
            action: event.action as AnalyticsEventAction,
            timestamp: event.timestamp,
            session_id: event.session_id,
            name: "Unknown event",
            description: `Unknown event ${event.action}`,
          }
        }
      }
    })

    return { data: result, projectId }
  })
