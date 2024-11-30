import { createTRPCRouter } from "../../../trpc"
import { cancelPhase } from "./cancelPhase"
import { create } from "./create"
import { createPhase } from "./createPhase"
import { getById } from "./getById"
import { listByActiveProject } from "./listByActiveProject"
import { listByPlanVersion } from "./listByPlanVersion"
import { signUp } from "./signUp"
import { updatePhase } from "./updatePhase"

export const subscriptionRouter = createTRPCRouter({
  create: create,
  createPhase: createPhase,
  listByActiveProject: listByActiveProject,
  listByPlanVersion: listByPlanVersion,
  signUp: signUp,
  getById: getById,
  cancelPhase: cancelPhase,
  updatePhase: updatePhase,
})
