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
  path: "/v1/customer/reportUsage",
  operationId: "customer.reportUsage",
  description: "Report usage for a customer",
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
        usage: z.number().openapi({
          description: "The usage",
          example: 30,
        }),
        idempotenceKey: z.string().uuid().openapi({
          description: "The idempotence key",
          example: "123e4567-e89b-12d3-a456-426614174000",
        }),
        metadata: z
          .record(z.string(), z.string())
          .openapi({
            description: "The metadata",
            example: {
              action: "create",
              country: "US",
            },
          })
          .optional(),
      }),
      "The usage to report"
    ),
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

export type ReportUsageRequest = z.infer<
  (typeof route.request.body)["content"]["application/json"]["schema"]
>
export type ReportUsageResponse = z.infer<
  (typeof route.responses)[200]["content"]["application/json"]["schema"]
>

export const registerReportUsageV1 = (app: App) =>
  app.openapi(route, async (c) => {
    const { customerId, featureSlug, usage, idempotenceKey, metadata } = c.req.valid("json")
    const { entitlement } = c.get("services")
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
    const result = await entitlement.reportUsage({
      customerId,
      featureSlug,
      usage,
      // timestamp of the record
      timestamp: Date.now(),
      // now date
      now: Date.now(),
      idempotenceKey,
      projectId: key.projectId,
      requestId,
      metadata,
    })

    return c.json(result, HttpStatusCodes.OK)
  })
