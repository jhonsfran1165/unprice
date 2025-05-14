import { z } from "zod"

export const DEFAULT_INTERVALS = {
  "60m": "Last 60 Minutes",
  "24h": "Last 24 Hours",
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  "90d": "Last 3 Months",
} as const

export const analyticsIntervalSchema = z.enum(["60m", "24h", "7d", "30d", "90d"] as const)

export type Interval = keyof typeof DEFAULT_INTERVALS
export const INTERVAL_KEYS = Object.keys(DEFAULT_INTERVALS) as Array<keyof typeof DEFAULT_INTERVALS>
export const DEFAULT_INTERVAL = "60m"

export function prepareInterval(interval: Interval) {
  const now = new Date()

  switch (interval) {
    case "60m": {
      const end = now.setUTCMinutes(now.getUTCMinutes() + 1, 0, 0)
      const intervalMs = 1000 * 60 * 60
      return {
        start: end - intervalMs,
        end,
        intervalMs,
        granularity: 1000 * 60,
      }
    }
    case "24h": {
      const end = now.setUTCHours(now.getUTCHours() + 1, 0, 0, 0)
      const intervalMs = 1000 * 60 * 60 * 24
      return {
        start: end - intervalMs,
        end,
        intervalMs,
        granularity: 1000 * 60 * 60,
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
        granularity: 1000 * 60 * 60 * 24,
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
        granularity: 1000 * 60 * 60 * 24,
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
        granularity: 1000 * 60 * 60 * 24,
      }
    }
  }
}
