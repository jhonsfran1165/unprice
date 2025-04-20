import { createTRPCRouter } from "#trpc"
import { create } from "./create"
import { exist } from "./exist"
import { getById } from "./getById"
import { getBySlug } from "./getBySlug"
import { listByActiveProject } from "./listByActiveProject"
import { remove } from "./remove"
import { searchBy } from "./searchBy"
import { update } from "./update"

export const featureRouter = createTRPCRouter({
  create,
  remove,
  update,
  exist,
  getBySlug,
  getById,
  searchBy,
  listByActiveProject,
})
