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
  path: "/v1/customer/{customerId}/reportUsage",
  operationId: "customer.reportUsage",
  method: "post",
  tags,
  request: {
    params: z.object({
      customerId: z.string().openapi({
        description: "The customer ID",
        example: "cus_1GTzSGrapiBW1QwCL3Fc",
        param: {
          name: "customerId",
          in: "path",
          example: "cus_1GTzSGrapiBW1QwCL3Fc",
        },
      }),
    }),
    body: jsonContentRequired(
      z.object({
        featureSlug: z.string().openapi({
          description: "The feature slug",
          example: "feature-1",
        }),
        usage: z.number().openapi({
          description: "The usage",
          example: 100,
        }),
        idempotenceKey: z.string().uuid().openapi({
          description: "The idempotence key",
          example: "123e4567-e89b-12d3-a456-426614174000",
        }),
      }),
      "The usage to report"
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        valid: z.boolean(),
        message: z.string().optional(),
        cacheHit: z.boolean().optional(),
        remaining: z.number().optional(),
      }),
      "The result of the report usage"
    ),
    ...openApiErrorResponses,
  },
})

export type ReportUsageRequest = z.infer<typeof route.request.params>
export type ReportUsageResponse = z.infer<
  (typeof route.responses)[200]["content"]["application/json"]["schema"]
>

export const registerReportUsageV1 = (app: App) =>
  app.openapi(route, async (c) => {
    const { customerId } = c.req.valid("param")
    const { featureSlug, usage, idempotenceKey } = c.req.valid("json")
    const { usagelimit, cache } = c.get("services")

    // validate the request
    const key = await keyAuth(c)

    if (!key) {
      throw new UnpriceApiError({
        code: "UNAUTHORIZED",
        message: "Invalid API key",
      })
    }

    // check if the usage has been reported before
    const cacheHit = await cache.idempotentRequestUsageByHash.get(
      `idempotenceKey:${idempotenceKey}`
    )

    if (cacheHit.val) {
      return c.json(
        {
          valid: cacheHit.val?.access,
          message: cacheHit.val?.message,
          cacheHit: true,
        },
        HttpStatusCodes.OK
      )
    }

    // validate usage from db
    const result = await usagelimit.reportUsage({
      customerId,
      featureSlug,
      usage,
      date: Date.now(),
      idempotenceKey,
      projectId: key.projectId,
    })

    // this will be executed after the response is sent
    // could be inconsistent data if the same request is made multiple times too fast
    // the durable object has a Map to set cache in memory
    // either way events are deduplicated by the analytics db
    c.executionCtx.waitUntil(
      cache.idempotentRequestUsageByHash.set(
        `idempotenceKey:${idempotenceKey}`,
        {
          access: result.valid,
          message: result.message,
        },
        {
          fresh: 1000 * 60, // 1 minute
          stale: 1000 * 60, // delete after 1 minutes
        }
      )
    )

    return c.json(result, HttpStatusCodes.OK)
  })
