import { createTRPCRouter } from "#trpc"

import { getAllFeatureVerificationsActiveProject } from "./getAllFeatureVerificationsActiveProject"
import { getTotalUsagePerFeatureActiveProject } from "./getTotalUsagePerFeatureActiveProject"
import { getUsageActiveEntitlementsCustomer } from "./getUsageActiveEntitlementsCustomer"
import { getUsageActiveEntitlementsCustomerUnprice } from "./getUsageActiveEntitlementsCustomerUnprice"

export const analyticsRouter = createTRPCRouter({
  getTotalUsagePerFeatureActiveProject: getTotalUsagePerFeatureActiveProject,
  getAllFeatureVerificationsActiveProject: getAllFeatureVerificationsActiveProject,
  getUsageActiveEntitlementsCustomer: getUsageActiveEntitlementsCustomer,
  // unrpice procedure is not available with apikeys api keys - and it's used for internal api only
  getUsageActiveEntitlementsCustomerUnprice: getUsageActiveEntitlementsCustomerUnprice,
})
