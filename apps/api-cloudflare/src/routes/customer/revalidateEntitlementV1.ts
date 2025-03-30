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
  path: "/v1/customer/{customerId}/revalidateEntitlement",
  operationId: "customer.revalidateEntitlement",
  description: "Pull new entitlement configuration from Unprice",
  method: "post",
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
    body: jsonContentRequired(
      z.object({
        featureSlug: z.string().openapi({
          description: "The feature slug to revalidate",
          example: "tokens",
        }),
      }),
      "The feature slug to revalidate"
    ),
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

export type RevalidateEntitlementRequest = z.infer<typeof route.request.params>
export type RevalidateEntitlementResponse = z.infer<
  (typeof route.responses)[200]["content"]["application/json"]["schema"]
>

export const registerRevalidateEntitlementV1 = (app: App) =>
  app.openapi(route, async (c) => {
    const { customerId } = c.req.valid("param")
    const { featureSlug } = c.req.valid("json")
    const { usagelimit } = c.get("services")

    // validate the request
    const key = await keyAuth(c)

    if (!key) {
      throw new UnpriceApiError({
        code: "UNAUTHORIZED",
        message: "Invalid API key",
      })
    }

    // validate usage from db
    const result = await usagelimit.revalidateEntitlement(
      customerId,
      featureSlug,
      key.projectId,
      Date.now()
    )

    return c.json(result, HttpStatusCodes.OK)
  })
