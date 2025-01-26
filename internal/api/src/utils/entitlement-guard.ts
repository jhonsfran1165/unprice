import { TRPCError } from "@trpc/server"

import type { Database } from "@unprice/db"
import { CustomerService, UnPriceCustomerError } from "@unprice/services/customers"
import type { Context } from "../trpc"

export const entitlementGuard = async ({
  customerId,
  ctx,
  featureSlug,
  skipCache = false,
  updateUsage = true,
  includeCustom = true,
  throwOnNoAccess = true,
  isInternal = false,
}: {
  customerId: string
  ctx: Context
  featureSlug: string
  skipCache?: boolean
  updateUsage?: boolean
  includeCustom?: boolean
  throwOnNoAccess?: boolean
  isInternal?: boolean
}) => {
  // internal workspaces have unlimited access to all features
  if (isInternal) {
    return []
  }

  const now = performance.now()
  const customer = new CustomerService({
    cache: ctx.cache,
    db: ctx.db as Database,
    analytics: ctx.analytics,
    logger: ctx.logger,
    metrics: ctx.metrics,
    waitUntil: ctx.waitUntil,
  })

  // use current date for now
  const date = Date.now()

  const { err, val } = await customer.getEntitlementByDate({
    customerId,
    featureSlug,
    date: date,
    includeCustom,
    // update usage from analytics service on revalidation
    updateUsage,
    skipCache,
  })

  const end = performance.now()

  ctx.metrics.emit({
    metric: "metric.db.read",
    query: "getEntitlementByDate",
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
          code: "UNAUTHORIZED",
          message: err.message,
        })
      default:
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Error verifying feature: ${err.toString()}`,
        })
    }
  }

  if (!val.id && throwOnNoAccess) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: `You don't have access to this feature. Please upgrade your plan.`,
    })
  }

  return val
}
