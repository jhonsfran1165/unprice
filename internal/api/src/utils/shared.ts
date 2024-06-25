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
    waitUntil: ctx.waitUntil,
  })

  // current year and month - we only support current month and year for now
  const t = new Date()
  t.setUTCMonth(t.getUTCMonth() - 1)
  const year = t.getUTCFullYear()
  const month = t.getUTCMonth() + 1 // months are 0 indexed

  const { err, val } = await customer.verifyFeature({
    customerId,
    featureSlug,
    projectId,
    year,
    month,
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
          code: "INTERNAL_SERVER_ERROR",
          message: err.code,
        })
      default:
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Error verifying feature: ${err.toString()}`,
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
    waitUntil: ctx.waitUntil,
  })

  const { err, val } = await customer.getEntitlements({
    customerId,
    projectId,
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
          message: "Error verifying entitlements",
        })
    }
  }

  return val
}

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
    waitUntil: ctx.waitUntil,
  })

  // current year and month - we only support current month and year for now
  const t = new Date()
  t.setUTCMonth(t.getUTCMonth() - 1)
  const year = t.getUTCFullYear()
  const month = t.getUTCMonth() + 1 // months are 0 indexed

  const { err, val } = await customer.reportUsage({
    customerId,
    featureSlug,
    projectId,
    usage,
    year,
    month,
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
          message: `Error verifying feature: ${err.toString()}`,
        })
    }
  }

  return val
}
