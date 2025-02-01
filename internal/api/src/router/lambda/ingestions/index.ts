import { createTRPCRouter } from "#trpc"
import { byId } from "./byId"
import { list } from "./list"
import { upload } from "./upload"

export const ingestionRouter = createTRPCRouter({
  byId,
  list,
  upload,
})
