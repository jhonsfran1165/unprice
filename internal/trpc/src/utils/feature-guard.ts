import { TRPCError } from "@trpc/server"
import { Unprice } from "@unprice/api"
import { env } from "#env"
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
  isMain = false,
  metadata = {},
}: {
  /** The UnPrice customer ID to check feature access for */
  customerId: string
  /** The feature slug to verify access to */
  featureSlug: string
  /** Whether this is an internal workspace with unlimited access. Defaults to false */
  isMain?: boolean
  /** Metadata to include in the feature verification. Defaults to an empty object */
  metadata?: Record<string, string | undefined>
}) => {
  // internal workspaces have unlimited access to all features
  if (isMain) {
    return {
      success: true,
    }
  }

  const unprice = new Unprice({
    token: env.UNPRICE_API_KEY,
  })

  console.log("unprice", customerId, featureSlug, metadata)

  const { result, error } = await unprice.customers.can({
    customerId,
    featureSlug,
    metadata,
  })

  console.log("result", result)
  console.log("error", error)

  if (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    })
  }

  return result
}
