import { createTRPCRouter } from "#trpc"
import { listOrganizations } from "./listOrganizations"

export const authRouter = createTRPCRouter({
  listOrganizations: listOrganizations,
})
