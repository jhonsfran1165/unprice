import { TRPCError } from "@trpc/server"
import { CustomerService, UnPriceCustomerError } from "@unprice/services/customers"
import type { Context } from "../trpc"

import type { Database } from "@unprice/db"

/**
 * Shared logic for verifying feature access across procedures.
 * Uses UnPrice's own product to manage feature access internally,
 * rather than setting up the UnPrice SDK.
 *
 * @returns Promise resolving to {access: boolean, deniedReason: string | null}
 */
export const featureGuard = async ({
  customerId,
  featureSlug,
  ctx,
  noCache = false,
  updateUsage = false,
  includeCustom = true,
  isInternal = false,
  throwOnNoAccess = true,
}: {
  /** The UnPrice customer ID to check feature access for */
  customerId: string
  /** The feature slug to verify access to */
  featureSlug: string
  /** The TRPC context containing services like cache, db, analytics etc */
  ctx: Context
  /** Whether to bypass cache and check entitlement directly. Defaults to false */
  noCache?: boolean
  /** Whether to increment usage counter for the feature. Defaults to false */
  updateUsage?: boolean
  /** Whether to include custom entitlements in check. Defaults to true */
  includeCustom?: boolean
  /** Whether this is an internal workspace with unlimited access. Defaults to false */
  isInternal?: boolean
  /** Whether to throw error on no access, meaning the customer does have the entitlement but it's not active or limits reached. If false, returns access:false instead. Defaults to true */
  throwOnNoAccess?: boolean
}) => {
  // internal workspaces have unlimited access to all features
  if (isInternal) {
    return {
      access: true,
      deniedReason: null,
    }
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

  const { err, val } = await customer.verifyEntitlement({
    customerId,
    featureSlug,
    date,
    noCache,
    updateUsage,
    includeCustom,
  })

  const end = performance.now()

  ctx.metrics.emit({
    metric: "metric.db.read",
    query: "verifyEntitlement",
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

  // if the feature is not found in the subscription or the customer is not found, throw an error
  if (
    val.deniedReason &&
    ["FEATURE_NOT_FOUND_IN_SUBSCRIPTION", "FEATURE_OR_CUSTOMER_NOT_FOUND"].includes(
      val.deniedReason
    )
  ) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: `You don't have access to this feature ${val.deniedReason}. Please upgrade your plan.`,
    })
  }

  if (!val.access && throwOnNoAccess) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: `You don't have access to this feature ${val.deniedReason}.`,
    })
  }

  return val
}
