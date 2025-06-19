import { createTRPCRouter } from "#trpc"
import { getStats } from "./getStats"
import { getUsage } from "./getUsage"
import { getVerifications } from "./getVerifications"

export const analyticsRouter = createTRPCRouter({
  getVerifications: getVerifications,
  getUsage: getUsage,
  getStats: getStats,
})
