import { createTRPCRouter } from "#trpc"
import { getFeatureHeatmap } from "./getFeatureHeatmap"
import { getStats } from "./getStats"
import { getUsage } from "./getUsage"
import { getVerifications } from "./getVerifications"
import { migrate } from "./migrate"

export const analyticsRouter = createTRPCRouter({
  getVerifications: getVerifications,
  getUsage: getUsage,
  migrate: migrate,
  getStats: getStats,
  getFeatureHeatmap: getFeatureHeatmap,
})
