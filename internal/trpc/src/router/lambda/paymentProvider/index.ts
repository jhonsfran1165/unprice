import { createTRPCRouter } from "#trpc"
import { getConfig } from "./getConfig"
import { saveConfig } from "./saveConfig"

export const paymentProviderRouter = createTRPCRouter({
  saveConfig: saveConfig,
  getConfig: getConfig,
})
