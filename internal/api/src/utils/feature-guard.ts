import { TRPCError } from "@trpc/server"
import type { FeatureVerification } from "@unprice/db/validators"
import { CustomerService, UnPriceCustomerError } from "#services/customers"
import type { Context } from "#trpc"

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
  skipCache = false,
  updateUsage = false,
  includeCustom = true,
  isInternal = false,
  metadata = {},
}: {
  /** The UnPrice customer ID to check feature access for */
  customerId: string
  /** The feature slug to verify access to */
  featureSlug: string
  /** The TRPC context containing services like cache, db, analytics etc */
  ctx: Context
  /** Whether to bypass cache and check entitlement directly. Defaults to false */
  skipCache?: boolean
  /** Whether to increment usage counter for the feature. Defaults to false */
  updateUsage?: boolean
  /** Whether to include custom entitlements in check. Defaults to true */
  includeCustom?: boolean
  /** Whether this is an internal workspace with unlimited access. Defaults to false */
  isInternal?: boolean
  /** Metadata to include in the feature verification. Defaults to an empty object */
  metadata?: Record<string, string | number | boolean | null>
}): Promise<FeatureVerification> => {
  // internal workspaces have unlimited access to all features
  if (isInternal) {
    return {
      access: true,
    }
  }

  const now = performance.now()
  const customer = new CustomerService(ctx)

  // use current date for now
  const date = Date.now()

  const { err, val } = await customer.verifyEntitlement({
    customerId,
    featureSlug,
    date,
    skipCache,
    updateUsage,
    includeCustom,
    metadata,
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
        return {
          access: false,
          deniedReason: err.code,
          message: err.message,
        }
      default:
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Error verifying feature: ${err.toString()}`,
        })
    }
  }

  return val
}
