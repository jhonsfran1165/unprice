import { createTRPCRouter } from "../../../trpc"
import { getAllFeatureVerificationsActiveProject } from "./getAllFeatureVerificationsActiveProject"
import { getTotalUsagePerFeatureActiveProject } from "./getTotalUsagePerFeatureActiveProject"

export const analyticsRouter = createTRPCRouter({
  getTotalUsagePerFeatureActiveProject,
  getAllFeatureVerificationsActiveProject,
})
