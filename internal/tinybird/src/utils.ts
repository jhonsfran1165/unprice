import { z } from "zod"

export const DEFAULT_INTERVALS = {
  "24h": "Last 24 Hours",
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
} as const

export const analyticsIntervalSchema = z.enum(["24h", "7d", "30d"] as const)

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
  }
}
