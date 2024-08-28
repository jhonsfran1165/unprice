import { createTRPCRouter } from "../../../trpc"
import { can } from "./can"
import { create } from "./create"
import { createPaymentMethod } from "./createPaymentMethod"
import { entitlements } from "./entitlements"
import { exist } from "./exist"
import { getByEmail } from "./getByEmail"
import { getById } from "./getById"
import { getByIdActiveProject } from "./getByIdActiveProject"
import { getSubscriptions } from "./getSubscriptions"
import { listByActiveProject } from "./listByActiveProject"
import { listPaymentMethods } from "./listPaymentMethods"
import { remove } from "./remove"
import { reportUsage } from "./reportUsage"
import { signOut } from "./signOut"
import { signUp } from "./signUp"
import { update } from "./update"

export const customersRouter = createTRPCRouter({
  create,
  remove,
  update,
  listPaymentMethods,
  signUp,
  signOut,
  createPaymentMethod,
  exist,
  getByEmail,
  getById,
  getByIdActiveProject,
  getSubscriptions,
  listByActiveProject,
  entitlements,
  can,
  reportUsage,
})
