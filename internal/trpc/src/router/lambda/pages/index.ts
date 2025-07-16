import { createTRPCRouter } from "#trpc"
import { create } from "./create"
import { getByDomain } from "./getByDomain"
import { getById } from "./getById"
import { listByActiveProject } from "./listByActiveProject"
import { publish } from "./publish"
import { remove } from "./remove"
import { update } from "./update"
import { uploadLogo } from "./upload-logo"

export const pageRouter = createTRPCRouter({
  create: create,
  update: update,
  publish: publish,
  getById: getById,
  getByDomain: getByDomain,
  remove: remove,
  listByActiveProject: listByActiveProject,
  uploadLogo: uploadLogo,
})
