import { createTRPCRouter } from "#trpc"

import { can } from "./can"
import { entitlements } from "./entitlements"
import { listPaymentMethods } from "./listPaymentMethods"
import { reportUsage } from "./reportUsage"
import { signOut } from "./signOut"
import { signUp } from "./signUp"

export const customersRouter = createTRPCRouter({
  listPaymentMethods: listPaymentMethods,
  signUp: signUp,
  signOut: signOut,
  entitlements: entitlements,
  can: can,
  reportUsage: reportUsage,
})
