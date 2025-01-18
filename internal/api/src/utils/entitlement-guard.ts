import { TRPCError } from "@trpc/server"

import type { Context } from "../trpc"
import { getEntitlements } from "./shared"

export const entitlementGuard = async ({
  customerId,
  ctx,
  featureSlug,
}: {
  customerId: string
  ctx: Context
  featureSlug: string
}) => {
  const entitlements = await getEntitlements({
    customerId: customerId,
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
