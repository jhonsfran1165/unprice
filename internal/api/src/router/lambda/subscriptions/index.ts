import { createTRPCRouter } from "../../../trpc"
import { cancelPhase } from "./cancelPhase"
import { create } from "./create"
import { getById } from "./getById"
import { listByActiveProject } from "./listByActiveProject"
import { listByPlanVersion } from "./listByPlanVersion"
import { signUp } from "./signUp"

export const subscriptionRouter = createTRPCRouter({
  create: create,
  listByActiveProject: listByActiveProject,
  listByPlanVersion: listByPlanVersion,
  signUp: signUp,
  getById: getById,
  cancelPhase: cancelPhase,
})
