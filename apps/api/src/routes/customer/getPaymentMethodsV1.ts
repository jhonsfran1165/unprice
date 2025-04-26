import { createRoute } from "@hono/zod-openapi"
import * as HttpStatusCodes from "stoker/http-status-codes"
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers"

import { customerPaymentMethodSchema, paymentProviderSchema } from "@unprice/db/validators"
import { z } from "zod"
import { keyAuth } from "~/auth/key"
import { openApiErrorResponses } from "~/errors/openapi-responses"
import type { App } from "~/hono/app"

const tags = ["customer"]

export const route = createRoute({
  path: "/v1/customer/getPaymentMethods",
  operationId: "customer.getPaymentMethods",
  description: "Get payment methods for a customer",
  method: "post",
  tags,
  request: {
    body: jsonContentRequired(
      z.object({
        customerId: z.string().openapi({
          description: "The customer ID",
          example: "cus_1H7KQFLr7RepUyQBKdnvY",
        }),
        provider: paymentProviderSchema.openapi({
          description: "The payment provider",
          example: "stripe",
        }),
      }),
      "Body of the request"
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      customerPaymentMethodSchema.array(),
      "The result of the get payment methods"
    ),
    ...openApiErrorResponses,
  },
})

export type GetPaymentMethodsRequest = z.infer<
  (typeof route.request.body)["content"]["application/json"]["schema"]
>

export type GetPaymentMethodsResponse = z.infer<
  (typeof route.responses)[200]["content"]["application/json"]["schema"]
>

export const registerGetPaymentMethodsV1 = (app: App) =>
  app.openapi(route, async (c) => {
    const { customerId, provider } = c.req.valid("json")
    const { customer } = c.get("services")

    // validate the request
    const key = await keyAuth(c)

    // get payment methods from service
    const result = await customer.getPaymentMethods({
      customerId,
      provider,
      projectId: key.projectId,
      opts: {
        skipCache: false,
      },
    })

    if (result.err) {
      throw result.err
    }

    return c.json(result.val, HttpStatusCodes.OK)
  })
