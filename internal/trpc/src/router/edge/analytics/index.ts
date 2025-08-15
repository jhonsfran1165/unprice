import { createTRPCRouter } from "#trpc"
import { getBrowserVisits } from "./getBrowserVisits"
import { getCountryVisits } from "./getCountryVisits"
import { getFeatureHeatmap } from "./getFeatureHeatmap"
import { getFeaturesOverview } from "./getFeaturesOverview"
import { getLatestEvents } from "./getLatestEvents"
import { getOverviewStats } from "./getOverviewStats"
import { getPagesOverview } from "./getPagesOverview"
import { getPlanClickBySessionId } from "./getPlanClickBySessionId"
import { getPlansConversion } from "./getPlansConversion"
import { getPlansStats } from "./getPlansStats"
import { getUsage } from "./getUsage"
import { getVerificationRegions } from "./getVerificationRegions"
import { getVerifications } from "./getVerifications"
import { migrate } from "./migrate"

export const analyticsRouter = createTRPCRouter({
  getVerifications: getVerifications,
  getVerificationRegions: getVerificationRegions,
  getUsage: getUsage,
  getBrowserVisits: getBrowserVisits,
  getCountryVisits: getCountryVisits,
  migrate: migrate,
  getOverviewStats: getOverviewStats,
  getFeatureHeatmap: getFeatureHeatmap,
  getPlansConversion: getPlansConversion,
  getFeaturesOverview: getFeaturesOverview,
  getPlansStats: getPlansStats,
  getPagesOverview: getPagesOverview,
  getPlanClickBySessionId: getPlanClickBySessionId,
  getLatestEvents: getLatestEvents,
})
