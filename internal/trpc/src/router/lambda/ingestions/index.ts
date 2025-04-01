import { createTRPCRouter } from "#trpc"
import { byId } from "./byId"
import { list } from "./list"

export const ingestionRouter = createTRPCRouter({
  byId,
  list,
})
