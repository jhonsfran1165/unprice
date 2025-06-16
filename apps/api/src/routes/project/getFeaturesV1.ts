import { createRoute } from "@hono/zod-openapi"
import { endTime, startTime } from "hono/timing"
import * as HttpStatusCodes from "stoker/http-status-codes"
import { jsonContent } from "stoker/openapi/helpers"

import type { z } from "zod"
import { keyAuth } from "~/auth/key"
import { UnpriceApiError } from "~/errors/http"
import { openApiErrorResponses } from "~/errors/openapi-responses"
import type { App } from "~/hono/app"
import { getProjectFeaturesResponseSchema } from "~/project/interface"

const tags = ["project"]

export const route = createRoute({
  path: "/v1/project/getFeatures",
  operationId: "project.getFeatures",
  summary: "get features",
  description: "Get features for a project",
  method: "get",
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      getProjectFeaturesResponseSchema,
      "The result of the get features"
    ),
    ...openApiErrorResponses,
  },
})

export type GetFeaturesResponse = z.infer<
  (typeof route.responses)[200]["content"]["application/json"]["schema"]
>

export const registerGetFeaturesV1 = (app: App) =>
  app.openapi(route, async (c) => {
    const { project } = c.get("services")

    // start a new timer
    startTime(c, "keyAuth")

    // validate the request
    const key = await keyAuth(c)

    if (!key) {
      throw new UnpriceApiError({
        code: "UNAUTHORIZED",
        message: "Invalid API key",
      })
    }

    // end the timer
    endTime(c, "keyAuth")

    // start a new timer
    startTime(c, "getFeatures")

    // validate usage from db
    const result = await project.getProjectFeatures({
      projectId: key.projectId,
    })

    // end the timer
    endTime(c, "getFeatures")

    return c.json(result, HttpStatusCodes.OK)
  })
