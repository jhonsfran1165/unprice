import { createTRPCRouter } from "#/trpc"
import { create } from "./create"
import { getByDomain } from "./getByDomain"
import { getById } from "./getById"
import { listByActiveProject } from "./listByActiveProject"
import { remove } from "./remove"
import { update } from "./update"

export const pageRouter = createTRPCRouter({
  create,
  update,
  getById,
  getByDomain,
  remove,
  listByActiveProject,
})
