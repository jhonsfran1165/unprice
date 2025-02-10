import { createTRPCRouter } from "#trpc"
import { getUsage } from "./getUsage"
import { getUsageActiveEntitlementsCustomer } from "./getUsageActiveEntitlementsCustomer"
import { getUsageActiveEntitlementsCustomerUnprice } from "./getUsageActiveEntitlementsCustomerUnprice"
import { getVerifications } from "./getVerifications"

export const analyticsRouter = createTRPCRouter({
  getVerifications: getVerifications,
  getUsageActiveEntitlementsCustomer: getUsageActiveEntitlementsCustomer,
  // unrpice procedure is not available with apikeys api keys - and it's used for internal api only
  getUsageActiveEntitlementsCustomerUnprice: getUsageActiveEntitlementsCustomerUnprice,
  getUsage: getUsage,
})
