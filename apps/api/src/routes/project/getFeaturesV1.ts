import { createRoute } from "@hono/zod-openapi"
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

    // validate the request
    const key = await keyAuth(c)

    if (!key) {
      throw new UnpriceApiError({
        code: "UNAUTHORIZED",
        message: "Invalid API key",
      })
    }

    // validate usage from db
    const result = await project.getProjectFeatures({
      projectId: key.projectId,
    })

    return c.json(result, HttpStatusCodes.OK)
  })
