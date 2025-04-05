import { createTRPCRouter } from "#trpc"

import { listPaymentMethods } from "./listPaymentMethods"
import { signOut } from "./signOut"
import { signUp } from "./signUp"

export const customersRouter = createTRPCRouter({
  listPaymentMethods: listPaymentMethods,
  signUp: signUp,
  signOut: signOut,
})
