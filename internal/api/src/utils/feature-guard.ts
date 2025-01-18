import { TRPCError } from "@trpc/server"
import type { Context } from "../trpc"
import { verifyEntitlement } from "./shared"

export const featureGuard = async ({
  customerId,
  featureSlug,
  ctx,
  noCache = false,
  updateUsage = true,
  includeCustom = true,
}: {
  customerId: string
  featureSlug: string
  ctx: Context
  noCache?: boolean
  updateUsage?: boolean
  includeCustom?: boolean
}) => {
  const result = await verifyEntitlement({
    customerId: customerId,
    featureSlug: featureSlug,
    ctx: ctx,
    noCache,
    updateUsage,
    includeCustom,
  })

  if (!result.access) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: `You don't have access to this feature ${result.deniedReason}`,
    })
  }

  return result
}
