import { createTRPCRouter } from "../../../trpc"
import { getAllFeatureVerificationsActiveProject } from "./getAllFeatureVerificationsActiveProject"
import { getTotalUsagePerFeatureActiveProject } from "./getTotalUsagePerFeatureActiveProject"
import { getUsageCustomer } from "./getUsageCustomer"

export const analyticsRouter = createTRPCRouter({
  getTotalUsagePerFeatureActiveProject,
  getAllFeatureVerificationsActiveProject,
  getUsageCustomer,
})
