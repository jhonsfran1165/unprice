import { createRoute } from "@hono/zod-openapi"
import { getPlanVersionListResponseSchema } from "@unprice/db/validators"
import * as HttpStatusCodes from "stoker/http-status-codes"
import { jsonContent } from "stoker/openapi/helpers"

import { z } from "zod"
import { keyAuth } from "~/auth/key"
import { UnpriceApiError } from "~/errors/http"
import { openApiErrorResponses } from "~/errors/openapi-responses"
import type { App } from "~/hono/app"

const tags = ["plans"]

export const route = createRoute({
  path: "/v1/plans/getPlanVersion/{planVersionId}",
  operationId: "plans.getPlanVersion",
  description: "Get a plan version by id",
  method: "get",
  tags,
  request: {
    params: z.object({
      planVersionId: z.string().openapi({
        description: "The plan version id",
        example: "pv_1H7KQFLr7RepUyQBKdnvY",
      }),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        planVersion: getPlanVersionListResponseSchema,
      }),
      "The result of the get plan version"
    ),
    ...openApiErrorResponses,
  },
})

export type GetPlanVersionResponse = z.infer<
  (typeof route.responses)[200]["content"]["application/json"]["schema"]
>

export const registerGetPlanVersionV1 = (app: App) =>
  app.openapi(route, async (c) => {
    const { db } = c.get("services")
    const { planVersionId } = c.req.valid("param")

    // validate the request
    const key = await keyAuth(c)

    const planVersionData = await db.query.versions.findFirst({
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
          eq(version.id, planVersionId),
          eq(version.active, true),
          eq(version.status, "published")
        ),
    })

    if (!planVersionData) {
      throw new UnpriceApiError({
        code: "NOT_FOUND",
        message: "Plan version not found or not published",
      })
    }

    return c.json(
      {
        planVersion: planVersionData,
      },
      HttpStatusCodes.OK
    )
  })
