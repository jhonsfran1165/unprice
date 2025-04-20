import { createTRPCRouter } from "#trpc"
import { create } from "./create"
import { exists } from "./exists"
import { getAllByActiveWorkspace } from "./getAllByActiveWorkspace"
import { remove } from "./remove"
import { update } from "./update"
import { verify } from "./verify"

export const domainRouter = createTRPCRouter({
  exists,
  create,
  remove,
  update,
  getAllByActiveWorkspace,
  verify,
})
