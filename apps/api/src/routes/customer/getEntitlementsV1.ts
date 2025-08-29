import { createRoute } from "@hono/zod-openapi"
import { endTime, startTime } from "hono/timing"
import { FetchError } from "node_modules/@unprice/error/src/errors/fetch-error"
import { UnPriceCustomerError } from "node_modules/@unprice/services/src/customers/errors"
import * as HttpStatusCodes from "stoker/http-status-codes"
import { jsonContent } from "stoker/openapi/helpers"

import { z } from "zod"
import { keyAuth } from "~/auth/key"
import { getEntitlementsResponseSchema } from "~/entitlement/interface"
import { UnpriceApiError } from "~/errors/http"
import { openApiErrorResponses } from "~/errors/openapi-responses"
import type { App } from "~/hono/app"

const tags = ["customer"]

export const route = createRoute({
  path: "/v1/customer/{customerId}/getEntitlements",
  operationId: "customer.getEntitlements",
  summary: "get entitlements",
  description: "Get entitlements for a customer",
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
      getEntitlementsResponseSchema,
      "The result of the delete customer"
    ),
    ...openApiErrorResponses,
  },
})

export type GetEntitlementsRequest = z.infer<typeof route.request.params>
export type GetEntitlementsResponse = z.infer<
  (typeof route.responses)[200]["content"]["application/json"]["schema"]
>

export const registerGetEntitlementsV1 = (app: App) =>
  app.openapi(route, async (c) => {
    const { customerId } = c.req.valid("param")
    const { entitlement } = c.get("services")

    // validate the request
    const key = await keyAuth(c)

    // start a new timer
    startTime(c, "getEntitlements")

    // validate usage from db
    const { val: entitlements, err } = await entitlement.getEntitlements({
      customerId,
      projectId: key.projectId,
      now: Date.now(),
    })

    // end the timer
    endTime(c, "getEntitlements")

    // TODO: important to return the proper API error
    if (err) {
      switch (true) {
        case err instanceof UnPriceCustomerError:
          throw new UnpriceApiError({
            code: "BAD_REQUEST",
            message: err.message,
          })
        case err instanceof FetchError:
          throw new UnpriceApiError({
            code: "INTERNAL_SERVER_ERROR",
            message: err.message,
          })
      }
    }

    return c.json(entitlements, HttpStatusCodes.OK)
  })
