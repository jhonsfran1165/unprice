import { SchemaError } from "@unprice/error"
import type { Context } from "hono"
import { UnpriceApiError } from "~/errors"
import type { HonoEnv } from "~/hono/env"

/**
 * keyAuth takes the bearer token from the request and verifies the key
 *
 * if the key doesnt exist, isn't valid or isn't a root key, an error is thrown, which gets handled
 * automatically by hono
 */
export async function keyAuth(c: Context<HonoEnv>) {
  const authorization = c.req.header("authorization")?.replace("Bearer ", "")
  if (!authorization) {
    throw new UnpriceApiError({ code: "UNAUTHORIZED", message: "key required" })
  }

  const { apikey, analytics } = c.get("services")
  const { val: key, err } = await apikey.verifyApiKey(c, {
    key: authorization,
  })

  if (err) {
    switch (true) {
      case err instanceof SchemaError:
        throw new UnpriceApiError({
          code: "BAD_REQUEST",
          message: err.message,
        })
    }
    throw new UnpriceApiError({
      code: "INTERNAL_SERVER_ERROR",
      message: err.message,
    })
  }

  if (!key?.key) {
    throw new UnpriceApiError({
      code: "UNAUTHORIZED",
      message: "key not found",
    })
  }

  // TODO: send analytics event
  c.executionCtx.waitUntil(
    analytics.ingestFeaturesVerification({
      projectId: key.projectId,
      customerId: "",
      entitlementId: "",
      featureSlug: "",
      timestamp: Date.now(),
      requestId: c.get("requestId"),
      workspaceId: "",
      planVersionFeatureId: "",
      subscriptionItemId: "",
      subscriptionPhaseId: "",
      subscriptionId: "",
      deniedReason: "",
      metadata: {},
    })
  )

  return key
}
