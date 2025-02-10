import { createTRPCRouter } from "#trpc"
import { listOrganizations } from "./listOrganizations"
import { mySubscriptions } from "./mySubscriptions"

export const authRouter = createTRPCRouter({
  mySubscriptions: mySubscriptions,
  listOrganizations: listOrganizations,
})
