import { createTRPCRouter } from "#/trpc"
import { getConfig } from "./getConfig"
import { getSession } from "./getSession"
import { saveConfig } from "./saveConfig"

export const paymentProviderRouter = createTRPCRouter({
  saveConfig: saveConfig,
  getConfig: getConfig,
  getSession: getSession,
})
