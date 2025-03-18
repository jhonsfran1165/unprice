import { createRoute } from "@hono/zod-openapi"
import * as HttpStatusCodes from "stoker/http-status-codes"
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers"

import { z } from "zod"
import { keyAuth } from "~/auth/key"
import { openApiErrorResponses } from "~/errors/openapi-responses"
import type { App } from "~/hono/app"

const tags = ["Tasks"]

export const reportUsage = createRoute({
  path: "/customer/{customerId}/reportUsage",
  method: "post",
  tags,
  request: {
    params: z.object({
      customerId: z.string().openapi({
        description: "The customer ID",
        example: "123",
      }),
    }),
    body: jsonContentRequired(
      z.object({
        customerId: z.string().openapi({
          description: "The customer ID",
          example: "123",
        }),
        featureSlug: z.string().openapi({
          description: "The feature slug",
          example: "feature-1",
        }),
        usage: z.number().openapi({
          description: "The usage",
          example: 100,
        }),
        idempotenceKey: z.string().openapi({
          description: "The idempotence key",
          example: "123",
        }),
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
      }),
      "The result of the report usage"
    ),
    ...openApiErrorResponses,
  },
})

export type ReportUsageRequest = z.infer<typeof reportUsage.request.params>
export type ReportUsageResponse = z.infer<
  (typeof reportUsage.responses)[200]["content"]["application/json"]["schema"]
>

export const registerReportUsage = (app: App) =>
  app.openapi(reportUsage, async (c) => {
    const { customerId, featureSlug, usage, idempotenceKey } = c.req.valid("json")
    const { usagelimit } = c.get("services")

    // validate the request
    const key = await keyAuth(c)

    // get the customer feature either from cache or db
    const customer = await c.cache.customerById.get(customerId)

    // validate usage from do

    // report usage to tinybird

    // return the result

    if (!data) {
      return c.json(
        {
          success: false,
          message: "Invalid API key",
        },
        HttpStatusCodes.UNAUTHORIZED
      )
    }

    const result = await reportUsageFeature({
      customerId,
      featureSlug,
      usage,
      idempotenceKey,
    })

    return c.json(result, HttpStatusCodes.OK)
  })
