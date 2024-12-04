import { createTRPCRouter } from "../../../trpc"
import { cancel } from "./cancel"
import { create } from "./create"
import { createPhase } from "./createPhase"
import { getById } from "./getById"
import { listByActiveProject } from "./listByActiveProject"
import { listByPlanVersion } from "./listByPlanVersion"
import { removePhase } from "./removePhase"
import { signUp } from "./signUp"
import { updatePhase } from "./updatePhase"

export const subscriptionRouter = createTRPCRouter({
  create: create,
  createPhase: createPhase,
  listByActiveProject: listByActiveProject,
  listByPlanVersion: listByPlanVersion,
  signUp: signUp,
  getById: getById,
  cancel: cancel,
  updatePhase: updatePhase,
  removePhase: removePhase,
})
