import { TRPCError } from "@trpc/server"

import type { ProjectExtended } from "@builderai/db/validators"

import type { Context } from "../trpc"
import { verifyFeature } from "./shared"

export const featureGuard = async ({
  project,
  featureSlug,
  ctx,
}: {
  project: ProjectExtended
  featureSlug: string
  ctx: Context
}) => {
  const workspaceId = project.workspaceId
  const unpriceCustomerId = project.workspace.unPriceCustomerId

  // TODO: solve this
  if (!unpriceCustomerId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "This feature is not available for free",
    })
  }

  const result = await verifyFeature({
    customerId: unpriceCustomerId,
    featureSlug: featureSlug,
    projectId: project.id,
    workspaceId: workspaceId,
    ctx: ctx,
  })

  const { access, currentUsage, limit, deniedReason } = result

  if (!access) {
    if (deniedReason === "FEATURE_NOT_FOUND_IN_SUBSCRIPTION") {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Your plan does not have access to this feature, please upgrade your plan",
      })
    }

    if (limit && currentUsage >= limit) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "You have reached the limit of customers, please upgrade your plan",
      })
    }

    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "You don't have access to this feature, please upgrade your plan",
    })
  }

  return result
}
