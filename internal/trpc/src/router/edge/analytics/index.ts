import { createTRPCRouter } from "#trpc"
import { getFeatureHeatmap } from "./getFeatureHeatmap"
import { getFeaturesOverview } from "./getFeaturesOverview"
import { getOverviewStats } from "./getOverviewStats"
import { getPagesOverview } from "./getPagesOverview"
import { getPlansConversion } from "./getPlansConversion"
import { getPlansStats } from "./getPlansStats"
import { getUsage } from "./getUsage"
import { getVerifications } from "./getVerifications"
import { migrate } from "./migrate"

export const analyticsRouter = createTRPCRouter({
  getVerifications: getVerifications,
  getUsage: getUsage,
  migrate: migrate,
  getOverviewStats: getOverviewStats,
  getFeatureHeatmap: getFeatureHeatmap,
  getPlansConversion: getPlansConversion,
  getFeaturesOverview: getFeaturesOverview,
  getPlansStats: getPlansStats,
  getPagesOverview: getPagesOverview,
})
