import { createTRPCRouter } from "../../../trpc"
import { create } from "./create"
import { deactivate } from "./deactivate"
import { duplicate } from "./duplicate"
import { getById } from "./getById"
import { listByActiveProject } from "./listByActiveProject"
import { listByProjectId } from "./listByProjectId"
import { listByUnpriceProject } from "./listByUnpriceProject"
import { publish } from "./publish"
import { remove } from "./remove"
import { update } from "./update"

export const planVersionRouter = createTRPCRouter({
  create,
  deactivate,
  remove,
  update,
  duplicate,
  publish,
  getById,
  listByProjectId,
  listByActiveProject,
  listByUnpriceProject,
})
