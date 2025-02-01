import { createTRPCRouter } from "#/trpc"
import { create } from "./create"
import { listByActiveProject } from "./listByActiveProject"
import { revoke } from "./revoke"
import { roll } from "./roll"

export const apiKeyRouter = createTRPCRouter({
  listByActiveProject: listByActiveProject,
  create: create,
  revoke: revoke,
  roll: roll,
})
