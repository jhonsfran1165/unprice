import { createRoute } from "@hono/zod-openapi"
import { FEATURE_SLUGS } from "@unprice/config"
import { endTime } from "hono/timing"
import { startTime } from "hono/timing"
import * as HttpStatusCodes from "stoker/http-status-codes"
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers"

import { z } from "zod"
import { keyAuth } from "~/auth/key"
import { canResponseSchema } from "~/entitlement/interface"
import { openApiErrorResponses } from "~/errors/openapi-responses"
import type { App } from "~/hono/app"
const tags = ["customer"]

export const route = createRoute({
  path: "/v1/customer/can",
  operationId: "customer.can",
  summary: "can feature",
  description: "Check if a customer can use a feature",
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
        // timestamp: z.number().optional().openapi({
        //   description: "The timestamp of the request",
        //   example: 1717852800,
        // }),
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
      "Body of the request"
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(canResponseSchema, "The result of the can check"),
    ...openApiErrorResponses,
  },
})

export type CanRequest = z.infer<
  (typeof route.request.body)["content"]["application/json"]["schema"]
>
export type CanResponse = z.infer<
  (typeof route.responses)[200]["content"]["application/json"]["schema"]
>

export const registerCanV1 = (app: App) =>
  app.openapi(route, async (c) => {
    const { customerId, featureSlug, metadata } = c.req.valid("json")
    const { entitlement, customer, logger } = c.get("services")
    const stats = c.get("stats")
    const requestId = c.get("requestId")
    const performanceStart = c.get("performanceStart")

    // validate the request
    const key = await keyAuth(c)

    // start a new timer
    startTime(c, "can")

    // validate usage from db
    const result = await entitlement.can({
      customerId,
      featureSlug,
      projectId: key.projectId,
      requestId,
      performanceStart,
      // short ttl for dev
      secondsToLive: c.env.NODE_ENV === "development" ? 5 : undefined,
      timestamp: Date.now(), // for now we report the usage at the time of the request
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
                action: "can",
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
            .catch((err) => {
              logger.error("Failed to report usage", err)
            })
        }
      })
    )

    // end the timer
    endTime(c, "can")

    return c.json(result, HttpStatusCodes.OK)
  })
