import { createTRPCRouter } from "#/trpc"
import { create } from "./create"
import { deleteProject } from "./delete"
import { getById } from "./getById"
import { getBySlug } from "./getBySlug"
import { listByActiveWorkspace } from "./listByActiveWorkspace"
import { listByWorkspace } from "./listByWorkspace"
import { rename } from "./rename"
import { transferToPersonal } from "./transferToPersonal"
import { transferToWorkspace } from "./transferToWorkspace"
import { update } from "./update"
export const projectRouter = createTRPCRouter({
  create: create,
  delete: deleteProject,
  getBySlug: getBySlug,
  listByActiveWorkspace: listByActiveWorkspace,
  listByWorkspace: listByWorkspace,
  rename: rename,
  update: update,
  getById: getById,
  transferToPersonal: transferToPersonal,
  transferToWorkspace: transferToWorkspace,
})
