import { createRoute } from "@hono/zod-openapi"
import { getPlanVersionListResponseSchema, getPlanVersionListSchema } from "@unprice/db/validators"
import * as HttpStatusCodes from "stoker/http-status-codes"
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers"

import { z } from "zod"
import { keyAuth } from "~/auth/key"
import { UnpriceApiError } from "~/errors/http"
import { openApiErrorResponses } from "~/errors/openapi-responses"
import type { App } from "~/hono/app"

const tags = ["plans"]

export const route = createRoute({
  path: "/v1/plans/listPlanVersions",
  operationId: "plans.listPlanVersions",
  description: "List all plan versions",
  method: "post",
  tags,
  request: {
    body: jsonContentRequired(getPlanVersionListSchema, "Body of the request"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        planVersions: getPlanVersionListResponseSchema.array(),
      }),
      "The result of the list plan versions"
    ),
    ...openApiErrorResponses,
  },
})

export type GetPlanVersionsResponse = z.infer<
  (typeof route.responses)[200]["content"]["application/json"]["schema"]
>

export type GetPlanVersionsRequest = z.infer<
  (typeof route.request.body)["content"]["application/json"]["schema"]
>

export const registerListPlanVersionsV1 = (app: App) =>
  app.openapi(route, async (c) => {
    const { db } = c.get("services")
    const { onlyPublished, onlyEnterprisePlan, onlyLatest } = c.req.valid("json")

    // validate the request
    const key = await keyAuth(c)

    const planVersionsData = await db.query.versions.findMany({
      with: {
        plan: true,
        planFeatures: {
          with: {
            feature: true,
          },
          orderBy(fields, operators) {
            return operators.asc(fields.order)
          },
        },
      },
      where: (version, { and, eq }) =>
        and(
          eq(version.projectId, key.projectId),
          eq(version.active, true),
          // get published versions by default, only get unpublished versions if the user wants it
          (onlyPublished && eq(version.status, "published")) || undefined,
          // latest versions by default, only get non latest versions if the user wants it
          (onlyLatest && eq(version.latest, true)) || undefined
        ),
    })

    if (planVersionsData.length === 0) {
      throw new UnpriceApiError({
        code: "NOT_FOUND",
        message: "Plan version not found or not published",
      })
    }

    if (onlyEnterprisePlan) {
      return c.json(
        {
          planVersions: planVersionsData.filter((version) => version.plan.enterprisePlan),
        },
        HttpStatusCodes.OK
      )
    }

    return c.json(
      {
        planVersions: planVersionsData.filter((version) => !version.plan.enterprisePlan),
      },
      HttpStatusCodes.OK
    )
  })
