import { TRPCError } from "@trpc/server"

import type { ProjectExtended } from "@unprice/db/validators"

import type { Context } from "../trpc"
import { getEntitlements } from "./shared"

export const entitlementGuard = async ({
  project,
  ctx,
  featureSlug,
}: {
  project: ProjectExtended
  ctx: Context
  featureSlug: string
}) => {
  const unpriceCustomerId = project.workspace.unPriceCustomerId

  const entitlements = await getEntitlements({
    customerId: unpriceCustomerId,
    projectId: project.id,
    ctx: ctx,
  })

  const access = entitlements.some((e) => e.featureSlug === featureSlug)

  if (!access) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "You don't have access to this feature, please upgrade your plan",
    })
  }

  return entitlements
}
