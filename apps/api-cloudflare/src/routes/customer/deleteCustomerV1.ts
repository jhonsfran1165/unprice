import { createRoute } from "@hono/zod-openapi"
import * as HttpStatusCodes from "stoker/http-status-codes"
import { jsonContent } from "stoker/openapi/helpers"

import { z } from "zod"
import { keyAuth } from "~/auth/key"
import { UnpriceApiError } from "~/errors/http"
import { openApiErrorResponses } from "~/errors/openapi-responses"
import type { App } from "~/hono/app"

const tags = ["customer"]

export const route = createRoute({
  path: "/v1/customer/{customerId}/delete",
  operationId: "customer.delete",
  description: "Delete customer configuration. Used when the customer is signed out.",
  method: "delete",
  tags,
  request: {
    params: z.object({
      customerId: z.string().openapi({
        description: "The customer ID",
        param: {
          name: "customerId",
          in: "path",
          example: "cus_1H7KQFLr7RepUyQBKdnvY",
        },
      }),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        success: z.boolean(),
        message: z.string().optional(),
      }),
      "The result of the delete customer"
    ),
    ...openApiErrorResponses,
  },
})

export type DeleteCustomerRequest = z.infer<typeof route.request.params>
export type DeleteCustomerResponse = z.infer<
  (typeof route.responses)[200]["content"]["application/json"]["schema"]
>

export const registerDeleteCustomerV1 = (app: App) =>
  app.openapi(route, async (c) => {
    const { customerId } = c.req.valid("param")
    const { usagelimit } = c.get("services")

    // validate the request
    const key = await keyAuth(c)

    if (!key) {
      throw new UnpriceApiError({
        code: "UNAUTHORIZED",
        message: "Invalid API key",
      })
    }

    // delete the customer from the DO
    const result = await usagelimit.deleteCustomer(customerId)

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
