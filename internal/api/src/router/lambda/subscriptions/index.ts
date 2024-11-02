import { createTRPCRouter } from "../../../trpc"
import { changePlan } from "./changePlan"
import { create } from "./create"
import { listByActiveProject } from "./listByActiveProject"
import { listByPlanVersion } from "./listByPlanVersion"
import { signUp } from "./signUp"

export const subscriptionRouter = createTRPCRouter({
  changePlan: changePlan,
  create: create,
  listByActiveProject: listByActiveProject,
  listByPlanVersion: listByPlanVersion,
  signUp: signUp,
})
