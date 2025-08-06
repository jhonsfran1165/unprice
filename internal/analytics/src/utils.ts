import { z } from "zod"

export const DEFAULT_INTERVALS = {
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
} as const

export const analyticsIntervalSchema = z.enum(["24h", "7d", "30d", "90d"] as const)

export type Interval = keyof typeof DEFAULT_INTERVALS
export const INTERVAL_KEYS = Object.keys(DEFAULT_INTERVALS) as Array<keyof typeof DEFAULT_INTERVALS>
export const DEFAULT_INTERVAL = "24h"

export function prepareInterval(interval: Interval) {
  const now = new Date()

  switch (interval) {
    case "24h": {
      const end = now.setUTCHours(now.getUTCHours() + 1, 0, 0, 0)
      const intervalMs = 1000 * 60 * 60 * 24
      return {
        start: end - intervalMs,
        end,
        intervalMs,
        intervalDays: 1,
        granularity: "hour",
        label: "Last 24 hours",
        name: "24h" as const,
      }
    }
    case "7d": {
      now.setUTCDate(now.getUTCDate() + 1)
      const end = now.setUTCHours(0, 0, 0, 0)
      const intervalMs = 1000 * 60 * 60 * 24 * 7
      return {
        start: end - intervalMs,
        end,
        intervalMs,
        intervalDays: 7,
        granularity: "day",
        label: "Last 7 days",
        name: "7d" as const,
      }
    }
    case "30d": {
      now.setUTCDate(now.getUTCDate() + 1)
      const end = now.setUTCHours(0, 0, 0, 0)
      const intervalMs = 1000 * 60 * 60 * 24 * 30
      return {
        start: end - intervalMs,
        end,
        intervalMs,
        intervalDays: 30,
        granularity: "day",
        label: "Last 30 days",
        name: "30d" as const,
      }
    }
    case "90d": {
      now.setUTCDate(now.getUTCDate() + 1)
      const end = now.setUTCHours(0, 0, 0, 0)
      const intervalMs = 1000 * 60 * 60 * 24 * 90
      return {
        start: end - intervalMs,
        end,
        intervalMs,
        intervalDays: 90,
        granularity: "day",
        label: "Last 90 days",
        name: "90d" as const,
      }
    }
  }
}
