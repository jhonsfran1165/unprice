import { SchemaError } from "@unprice/error"
import type { Context } from "hono"
import { endTime, startTime } from "hono/timing"
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

  const { apikey } = c.get("services")

  // start a new timer
  startTime(c, "verifyApiKey")

  const { val: key, err } = await apikey.verifyApiKey(c, {
    key: authorization,
  })

  // end the timer
  endTime(c, "verifyApiKey")

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

  if (!key) {
    throw new UnpriceApiError({
      code: "UNAUTHORIZED",
      message: "key not found",
    })
  }

  return key
}
