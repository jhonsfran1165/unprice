import { createRoute } from "@hono/zod-openapi"
import * as HttpStatusCodes from "stoker/http-status-codes"
import { jsonContent } from "stoker/openapi/helpers"

import { getActivePhaseResponseSchema } from "@unprice/db/validators"
import { UnPriceCustomerError } from "@unprice/services/customers"
import { z } from "zod"
import { keyAuth } from "~/auth/key"
import { openApiErrorResponses } from "~/errors/openapi-responses"
import type { App } from "~/hono/app"

const tags = ["customer"]

export const route = createRoute({
  path: "/v1/customer/{customerId}/getActivePhase",
  operationId: "customer.getActivePhase",
  description: "Get active phase for a customer",
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
      getActivePhaseResponseSchema,
      "The result of the get active phase"
    ),
    ...openApiErrorResponses,
  },
})

export type GetSubscriptionRequest = z.infer<typeof route.request.params>
export type GetSubscriptionResponse = z.infer<
  (typeof route.responses)[200]["content"]["application/json"]["schema"]
>

export const registerGetActivePhaseV1 = (app: App) =>
  app.openapi(route, async (c) => {
    const { customerId } = c.req.valid("param")
    const { customer } = c.get("services")
    const now = Date.now()

    // validate the request
    const key = await keyAuth(c)

    const { val, err } = await customer.getActivePhase({
      customerId,
      projectId: key.projectId,
      now,
    })

    if (err) {
      throw new UnPriceCustomerError({
        code: "CUSTOMER_PHASE_NOT_FOUND",
        message: `unable to get active phase for customer ${err.message}`,
      })
    }

    if (!val) {
      throw new UnPriceCustomerError({
        code: "CUSTOMER_PHASE_NOT_FOUND",
        message: "No active phase found",
      })
    }

    return c.json(val, HttpStatusCodes.OK)
  })
