import { createRoute } from "@hono/zod-openapi"
import * as HttpStatusCodes from "stoker/http-status-codes"
import { jsonContent } from "stoker/openapi/helpers"

import { z } from "zod"
import { keyAuth } from "~/auth/key"
import { getEntitlementsResponseSchema } from "~/entitlement/interface"
import { openApiErrorResponses } from "~/errors/openapi-responses"
import type { App } from "~/hono/app"

const tags = ["customer"]

export const route = createRoute({
  path: "/v1/customer/{customerId}/getEntitlements",
  operationId: "customer.getEntitlements",
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

    // validate usage from db
    const result = await entitlement.getEntitlements({
      customerId,
      projectId: key.projectId,
      now: Date.now(),
    })

    return c.json(result, HttpStatusCodes.OK)
  })
