import { createTRPCRouter } from "../../../trpc"
import { getAllFeatureVerificationsActiveProject } from "./getAllFeatureVerificationsActiveProject"
import { getTotalUsagePerFeatureActiveProject } from "./getTotalUsagePerFeatureActiveProject"
import { getUsageCustomer } from "./getUsageCustomer"
import { getUsageCustomerUnprice } from "./getUsageCustomerUnprice"

export const analyticsRouter = createTRPCRouter({
  getTotalUsagePerFeatureActiveProject: getTotalUsagePerFeatureActiveProject,
  getAllFeatureVerificationsActiveProject: getAllFeatureVerificationsActiveProject,
  getUsageCustomer: getUsageCustomer,
  getUsageCustomerUnprice: getUsageCustomerUnprice,
})
