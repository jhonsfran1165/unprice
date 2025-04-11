import { createTRPCRouter } from "#trpc"
import { getUsage } from "./getUsage"
import { getVerifications } from "./getVerifications"

export const analyticsRouter = createTRPCRouter({
  getVerifications: getVerifications,
  getUsage: getUsage,
})
