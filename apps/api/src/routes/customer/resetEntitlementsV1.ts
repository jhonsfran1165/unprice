import { createRoute } from "@hono/zod-openapi"
import * as HttpStatusCodes from "stoker/http-status-codes"
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers"

import { z } from "zod"
import { keyAuth } from "~/auth/key"
import { UnpriceApiError } from "~/errors/http"
import { openApiErrorResponses } from "~/errors/openapi-responses"
import type { App } from "~/hono/app"

const tags = ["customer"]

export const route = createRoute({
  path: "/v1/customer/{customerId}/reset-entitlements",
  operationId: "customer.resetEntitlements",
  description: "Reset entitlements for a customer",
  method: "post",
  tags,
  request: {
    body: jsonContentRequired(
      z.object({
        customerId: z.string().openapi({
          description: "The customer ID",
          example: "cus_1H7KQFLr7RepUyQBKdnvY",
        }),
      }),
      "The customer ID"
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        success: z.boolean(),
        message: z.string().optional(),
      }),
      "The result of the reset entitlements"
    ),
    ...openApiErrorResponses,
  },
})

export type ResetEntitlementsRequest = z.infer<
  (typeof route.request.body)["content"]["application/json"]["schema"]
>
export type ResetEntitlementsResponse = z.infer<
  (typeof route.responses)[200]["content"]["application/json"]["schema"]
>

export const registerResetEntitlementsV1 = (app: App) =>
  app.openapi(route, async (c) => {
    const { customerId } = c.req.valid("json")
    const { entitlement } = c.get("services")

    // validate the request
    const key = await keyAuth(c)

    if (!key) {
      throw new UnpriceApiError({
        code: "UNAUTHORIZED",
        message: "Invalid API key",
      })
    }

    // delete the customer from the DO
    const result = await entitlement.resetEntitlements(customerId, key.projectId)

    if (!result.success) {
      throw new UnpriceApiError({
        code: "INTERNAL_SERVER_ERROR",
        message: result.message,
      })
    }

    // TODO: delete from db
    // await db.delete(customers).where(eq(customers.id, customerId))

    return c.json(result, HttpStatusCodes.OK)
  })
