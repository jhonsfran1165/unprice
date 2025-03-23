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
  path: "/v1/customer/{customerId}/can/{featureSlug}",
  operationId: "customer.can",
  description: "Check if a customer can use a feature",
  method: "get",
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
      featureSlug: z.string().openapi({
        description: "The feature slug",
        param: {
          name: "featureSlug",
          in: "path",
          example: "tokens",
        },
      }),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        success: z.boolean(),
        message: z.string().optional(),
        cacheHit: z.boolean().optional(),
        remaining: z.number().optional(),
      }),
      "The result of the report usage"
    ),
    ...openApiErrorResponses,
  },
})

export type CanRequest = z.infer<typeof route.request.params>
export type CanResponse = z.infer<
  (typeof route.responses)[200]["content"]["application/json"]["schema"]
>

export const registerCanV1 = (app: App) =>
  app.openapi(route, async (c) => {
    const { customerId, featureSlug } = c.req.valid("param")
    const { usagelimit } = c.get("services")
    const requestId = c.get("requestId")

    // validate the request
    const key = await keyAuth(c)

    if (!key) {
      throw new UnpriceApiError({
        code: "UNAUTHORIZED",
        message: "Invalid API key",
      })
    }

    // validate usage from db
    const result = await usagelimit.can({
      customerId,
      featureSlug,
      projectId: key.projectId,
      requestId,
    })

    return c.json(result, HttpStatusCodes.OK)
  })
