import { TRPCError } from "@trpc/server"

import { UnpriceCustomer } from "../pkg/customer"
import { UnPriceCustomerError } from "../pkg/errors"
import type { Context } from "../trpc"

// shared logic for some procedures
// this way I use my product to build my product
// without setting up unprice sdk
export const verifyFeature = async ({
  customerId,
  featureSlug,
  projectId,
  workspaceId,
  ctx,
}: {
  customerId: string
  featureSlug: string
  projectId: string
  workspaceId: string
  ctx: Context
}) => {
  const customer = new UnpriceCustomer({
    cache: ctx.cache,
    db: ctx.db,
    analytics: ctx.analytics,
  })

  const { err, val } = await customer.verifyFeature({
    customerId,
    featureSlug,
    projectId,
    workspaceId,
    ctx,
  })

  if (err) {
    console.error("Error verifing feature", err)
    switch (true) {
      case err instanceof UnPriceCustomerError:
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err.code,
        })
      default:
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error verifying feature",
        })
    }
  }

  return val
}

// TODO: handling errors and logging here
export const reportUsageFeature = async ({
  customerId,
  featureSlug,
  projectId,
  usage,
  workspaceId,
  ctx,
}: {
  customerId: string
  featureSlug: string
  projectId: string
  workspaceId: string
  usage: number
  ctx: Context
}) => {
  const customer = new UnpriceCustomer({
    cache: ctx.cache,
    db: ctx.db,
    analytics: ctx.analytics,
  })

  const { err, val } = await customer.reportUsage({
    customerId,
    featureSlug,
    projectId,
    workspaceId,
    usage,
    ctx,
  })

  if (err) {
    console.error("Error reporting usage feature", err)
    switch (true) {
      case err instanceof UnPriceCustomerError:
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err.code,
        })
      default:
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error verifying feature",
        })
    }
  }

  return val
}
