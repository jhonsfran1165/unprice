import { createRoute } from "@hono/zod-openapi"
import { endTime } from "hono/timing"
import { startTime } from "hono/timing"
import * as HttpStatusCodes from "stoker/http-status-codes"
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers"

import { z } from "zod"
import { keyAuth } from "~/auth/key"
import { canResponseSchema } from "~/entitlement/interface"
import { UnpriceApiError } from "~/errors/http"
import { openApiErrorResponses } from "~/errors/openapi-responses"
import type { App } from "~/hono/app"
const tags = ["customer"]

export const route = createRoute({
  path: "/v1/customer/can",
  operationId: "customer.can",
  description: "Check if a customer can use a feature",
  method: "post",
  tags,
  request: {
    body: jsonContentRequired(
      z.object({
        customerId: z.string().openapi({
          description: "The customer ID",
          example: "cus_1H7KQFLr7RepUyQBKdnvY",
        }),
        featureSlug: z.string().openapi({
          description: "The feature slug",
          example: "tokens",
        }),
        metadata: z.record(z.string(), z.string()).openapi({
          description: "The metadata",
          example: {
            action: "create",
            country: "US",
          },
        }),
      }),
      "Body of the request"
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(canResponseSchema, "The result of the can check"),
    ...openApiErrorResponses,
  },
})

export type CanRequest = z.infer<
  (typeof route.request.body)["content"]["application/json"]["schema"]
>
export type CanResponse = z.infer<
  (typeof route.responses)[200]["content"]["application/json"]["schema"]
>

export const registerCanV1 = (app: App) =>
  app.openapi(route, async (c) => {
    const { customerId, featureSlug, metadata } = c.req.valid("json")
    const { entitlement } = c.get("services")
    const requestId = c.get("requestId")
    const performanceStart = c.get("performanceStart")

    // start a new timer
    startTime(c, "keyAuth")

    // validate the request
    const key = await keyAuth(c)

    if (!key) {
      throw new UnpriceApiError({
        code: "UNAUTHORIZED",
        message: "Invalid API key",
      })
    }
    endTime(c, "keyAuth")

    // start a new timer
    startTime(c, "can")

    // validate usage from db
    const result = await entitlement.can({
      customerId,
      featureSlug,
      projectId: key.projectId,
      requestId,
      performanceStart: performanceStart,
      now: Date.now(),
      metadata,
    })

    // end the timer
    endTime(c, "can")

    return c.json(result, HttpStatusCodes.OK)
  })
