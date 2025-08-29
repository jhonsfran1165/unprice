import { createRoute } from "@hono/zod-openapi"
import {
  analyticsIntervalSchema,
  getAnalyticsVerificationsResponseSchema,
  prepareInterval,
} from "@unprice/analytics"
import { FEATURE_SLUGS } from "@unprice/config"
import { endTime, startTime } from "hono/timing"
import * as HttpStatusCodes from "stoker/http-status-codes"
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers"

import { z } from "zod"
import { keyAuth } from "~/auth/key"
import { UnpriceApiError } from "~/errors"
import { openApiErrorResponses } from "~/errors/openapi-responses"
import type { App } from "~/hono/app"

const tags = ["analytics"]

export const route = createRoute({
  path: "/v1/analytics/verifications",
  operationId: "analytics.getVerifications",
  summary: "get verifications",
  description: "Get verifications for a customer in a given range",
  method: "post",
  tags,
  request: {
    body: jsonContentRequired(
      z.object({
        customerId: z.string().optional().openapi({
          description:
            "The customer ID if you want to get the verifications for a specific customer",
          example: "cus_1H7KQFLr7RepUyQBKdnvY",
        }),
        projectId: z.string().openapi({
          description:
            "The project ID (optional, if not provided, the project ID will be the one of the key)",
          example: "project_1H7KQFLr7RepUyQBKdnvY",
        }),
        range: analyticsIntervalSchema.openapi({
          description: "The range of the verifications, last hour, day, week or month",
          example: "24h",
        }),
      }),
      "Body of the request for the get verifications"
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        verifications: getAnalyticsVerificationsResponseSchema.array(),
      }),
      "The result of the get verifications"
    ),
    ...openApiErrorResponses,
  },
})

export type GetAnalyticsVerificationsRequest = z.infer<
  (typeof route.request.body)["content"]["application/json"]["schema"]
>

export type GetAnalyticsVerificationsResponse = z.infer<
  (typeof route.responses)[200]["content"]["application/json"]["schema"]
>

export const registerGetAnalyticsVerificationsV1 = (app: App) =>
  app.openapi(route, async (c) => {
    const { customerId, range, projectId } = c.req.valid("json")
    const { analytics, logger, customer, entitlement, db } = c.get("services")
    const requestId = c.get("requestId")

    // validate the request
    const key = await keyAuth(c)

    // start a new timer
    startTime(c, "getVerifications")

    const { intervalDays } = prepareInterval(range)

    // main workspace can see all verifications
    // TODO: abstract this to analytics service
    const isMain = key.project.workspace.isMain

    if (projectId && !isMain) {
      // validate project from the key and the projectId
      // are part of the same workspace
      const project = await db.query.projects.findFirst({
        with: {
          workspace: true,
        },
        where: (project, { eq }) => eq(project.id, projectId),
      })

      if (!project) {
        throw new UnpriceApiError({
          code: "NOT_FOUND",
          message: "Project not found",
        })
      }

      // for now the only way to check if two workspaces are related is by the createdBy field
      // TODO: improve this
      if (project.workspace.createdBy !== key.project.workspace.createdBy) {
        throw new UnpriceApiError({
          code: "FORBIDDEN",
          message: "You are not allowed to access this app analytics.",
        })
      }
    }

    // for now works but we need to get the proper data from the customer service
    // some features are over the whole dataset.
    // maybe it's better to query the do.
    // TODO: cache results
    const data = await analytics
      .getFeaturesVerifications({
        customerId,
        projectId,
        intervalDays,
      })
      .catch((err) => {
        logger.error(
          JSON.stringify({
            message: "Error getting verifications for customer",
            error: err.message,
          })
        )

        return {
          data: [],
        }
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
              idempotenceKey: `${requestId}:${unPriceCustomer.id}`,
              timestamp: Date.now(),
              // short ttl for dev
              secondsToLive: c.env.NODE_ENV === "development" ? 5 : undefined,
              metadata: {
                action: "verifications",
              },
            })
            .catch((err) => {
              logger.error("Failed to report usage", err)
            })
        }
      })
    )

    // end the timer
    endTime(c, "getVerifications")

    return c.json(
      {
        verifications: data.data,
      },
      HttpStatusCodes.OK
    )
  })
