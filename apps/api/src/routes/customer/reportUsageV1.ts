import { createRoute } from "@hono/zod-openapi"
import { FEATURE_SLUGS } from "@unprice/config"
import * as HttpStatusCodes from "stoker/http-status-codes"
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers"

import { z } from "zod"
import { keyAuth } from "~/auth/key"
import { openApiErrorResponses } from "~/errors/openapi-responses"
import type { App } from "~/hono/app"

const tags = ["customer"]

export const route = createRoute({
  path: "/v1/customer/reportUsage",
  operationId: "customer.reportUsage",
  summary: "report usage",
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
        timestamp: z.number().optional().openapi({
          description: "The timestamp of the request",
          example: 1717852800,
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
    const { customerId, featureSlug, usage, idempotenceKey, metadata, timestamp } =
      c.req.valid("json")
    const { entitlement, customer, logger } = c.get("services")
    const stats = c.get("stats")
    const requestId = c.get("requestId")

    // validate the request
    const key = await keyAuth(c)

    // validate usage from db
    const result = await entitlement.reportUsage({
      customerId,
      featureSlug,
      usage,
      // timestamp of the record
      timestamp: timestamp ?? Date.now(),
      idempotenceKey,
      projectId: key.projectId,
      requestId,
      metadata: {
        ...metadata,
        ip: stats.ip,
        country: stats.country,
        region: stats.region,
        colo: stats.colo,
        city: stats.city,
        latitude: stats.latitude,
        longitude: stats.longitude,
        ua: stats.ua,
        continent: stats.continent,
        source: stats.source,
      },
    })

    // unprice customer is the customer onwinging the key
    // so once the request is done, we can report the usage for the unprice customer
    const unPriceCustomerId = c.get("unPriceCustomerId")

    // send analytics event for the unprice customer
    c.executionCtx.waitUntil(
      Promise.resolve().then(async () => {
        if (unPriceCustomerId) {
          const { val: unPriceCustomer, err: unPriceCustomerErr } =
            await customer.getCustomer(unPriceCustomerId)

          if (unPriceCustomerErr || !unPriceCustomer) {
            logger.error("Failed to get unprice customer", {
              error: unPriceCustomerErr,
            })
            return
          }

          const shouldReportUsage =
            !unPriceCustomer.project.workspace.isInternal &&
            !unPriceCustomer.project.workspace.isMain

          // if the unprice customer is internal or main, we don't need to report the usage
          if (shouldReportUsage) {
            return
          }

          await entitlement
            .reportUsage({
              customerId: unPriceCustomer.id,
              featureSlug: FEATURE_SLUGS.EVENTS,
              projectId: unPriceCustomer.projectId,
              requestId,
              usage: 1,
              // short ttl for dev
              secondsToLive: c.env.NODE_ENV === "development" ? 5 : undefined,
              idempotenceKey: `${requestId}:${unPriceCustomer.id}`,
              timestamp: Date.now(),
              metadata: {
                action: "reportUsage",
                ip: stats.ip,
                country: stats.country,
                region: stats.region,
                datacenter: stats.datacenter,
                colo: stats.colo,
                city: stats.city,
                latitude: stats.latitude,
                longitude: stats.longitude,
                ua: stats.ua,
                continent: stats.continent,
                source: stats.source,
              },
            })
            .catch((err) => {
              logger.error("Failed to report usage", err)
            })
        }
      })
    )

    return c.json(result, HttpStatusCodes.OK)
  })
