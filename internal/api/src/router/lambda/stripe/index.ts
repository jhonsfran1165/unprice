import { createTRPCRouter } from "../../../trpc"
import { dinero } from "./dinero"
import { plans } from "./plans"

export const stripeRouter = createTRPCRouter({
  plans,
  dinero,
})
