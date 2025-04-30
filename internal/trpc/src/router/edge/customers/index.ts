import { createTRPCRouter } from "#trpc"

import { createPaymentMethod } from "./createPaymentMethod"
import { listPaymentMethods } from "./listPaymentMethods"
import { signOut } from "./signOut"

export const customersRouter = createTRPCRouter({
  listPaymentMethods: listPaymentMethods,
  signOut: signOut,
  createPaymentMethod: createPaymentMethod,
})
