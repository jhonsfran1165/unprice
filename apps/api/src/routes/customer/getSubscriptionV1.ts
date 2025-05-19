import { createRoute } from "@hono/zod-openapi"
import * as HttpStatusCodes from "stoker/http-status-codes"
import { jsonContent } from "stoker/openapi/helpers"

import { getSubscriptionResponseSchema } from "@unprice/db/validators"
import { z } from "zod"
import { keyAuth } from "~/auth/key"
import { UnpriceApiError } from "~/errors/http"
import { openApiErrorResponses } from "~/errors/openapi-responses"
import type { App } from "~/hono/app"

const tags = ["customer"]

export const route = createRoute({
  path: "/v1/customer/{customerId}/getSubscription",
  operationId: "customer.getSubscription",
  summary: "get subscription",
  description: "Get subscription with the active phase for a customer",
  method: "get",
  tags,
  request: {
    params: z.object({
      customerId: z.string().openapi({
        description: "The customer ID",
        example: "cus_1H7KQFLr7RepUyQBKdnvY",
      }),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      getSubscriptionResponseSchema,
      "The result of the get subscription"
    ),
    ...openApiErrorResponses,
  },
})

export type GetSubscriptionRequest = z.infer<typeof route.request.params>
export type GetSubscriptionResponse = z.infer<
  (typeof route.responses)[200]["content"]["application/json"]["schema"]
>

export const registerGetSubscriptionV1 = (app: App) =>
  app.openapi(route, async (c) => {
    const { customerId } = c.req.valid("param")
    const { customer } = c.get("services")

    // validate the request
    const key = await keyAuth(c)

    const { val: subscription, err } = await customer.getActiveSubscription(
      customerId,
      key.projectId
    )

    if (err) {
      throw new UnpriceApiError({
        code: "NOT_FOUND",
        message: "Subscription not found or not active",
      })
    }

    if (!subscription) {
      throw new UnpriceApiError({
        code: "NOT_FOUND",
        message: "Subscription not found or not active",
      })
    }

    return c.json(subscription, HttpStatusCodes.OK)
  })
