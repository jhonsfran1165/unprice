import { createTRPCRouter } from "../../../trpc"
import { create } from "./create"
import { createPaymentMethod } from "./createPaymentMethod"
import { exist } from "./exist"
import { getByEmail } from "./getByEmail"
import { getById } from "./getById"
import { getByIdActiveProject } from "./getByIdActiveProject"
import { getSubscriptions } from "./getSubscriptions"
import { listByActiveProject } from "./listByActiveProject"
import { remove } from "./remove"
import { update } from "./update"

export const customersRouter = createTRPCRouter({
  create,
  remove,
  update,
  createPaymentMethod,
  exist,
  getByEmail,
  getById,
  getByIdActiveProject,
  getSubscriptions,
  listByActiveProject,
})