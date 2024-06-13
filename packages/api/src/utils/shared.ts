import { TRPCError } from "@trpc/server"

import type { SubscriptionItem, SubscriptionItemExtended } from "@builderai/db/validators"
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
  ctx,
}: {
  customerId: string
  featureSlug: string
  projectId: string
  ctx: Context
}) => {
  const now = performance.now()
  const customer = new UnpriceCustomer({
    cache: ctx.cache,
    db: ctx.db,
    analytics: ctx.analytics,
    logger: ctx.logger,
    metrics: ctx.metrics,
  })

  const { err, val } = await customer.verifyFeature({
    customerId,
    featureSlug,
    projectId,
    ctx,
  })

  const end = performance.now()

  ctx.metrics.emit({
    metric: "metric.feature.verification",
    duration: end - now,
    customerId,
    featureSlug,
    valid: !err,
    code: err?.code ?? "",
    service: "customer",
  })

  if (err) {
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

export const getEntitlements = async ({
  customerId,
  projectId,
  ctx,
}: {
  customerId: string
  projectId: string
  ctx: Context
}) => {
  const customer = new UnpriceCustomer({
    cache: ctx.cache,
    db: ctx.db,
    analytics: ctx.analytics,
    logger: ctx.logger,
    metrics: ctx.metrics,
  })

  const { err, val } = await customer.getEntitlements({
    customerId,
    projectId,
  })

  if (err) {
    console.error("Error getting entitlements feature", err)
    switch (true) {
      case err instanceof UnPriceCustomerError:
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err.code,
        })
      default:
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error verifying entitlements",
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
    logger: ctx.logger,
    metrics: ctx.metrics,
  })

  const { err, val } = await customer.reportUsage({
    customerId,
    featureSlug,
    projectId,
    usage,
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
