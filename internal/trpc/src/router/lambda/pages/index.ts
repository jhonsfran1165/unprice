import { createTRPCRouter } from "#trpc"
import { create } from "./create"
import { getByDomain } from "./getByDomain"
import { getById } from "./getById"
import { listByActiveProject } from "./listByActiveProject"
import { remove } from "./remove"
import { update } from "./update"
import { uploadLogo } from "./upload-logo"

export const pageRouter = createTRPCRouter({
  create: create,
  update: update,
  getById: getById,
  getByDomain: getByDomain,
  remove: remove,
  listByActiveProject: listByActiveProject,
  uploadLogo: uploadLogo,
})
