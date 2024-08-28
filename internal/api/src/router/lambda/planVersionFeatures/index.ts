import { createTRPCRouter } from "../../../trpc"
import { create } from "./create"
import { getById } from "./getById"
import { getByPlanVersionId } from "./getByPlanVersionId"
import { remove } from "./remove"
import { update } from "./update"

export const planVersionFeatureRouter = createTRPCRouter({
  create,
  remove,
  update,
  getById,
  getByPlanVersionId,
})
