import { createRoute, z } from "@hono/zod-openapi"
import { openApiErrorResponses } from "~/errors"
import type { App } from "~/hono/app"

const route = createRoute({
  deprecated: true,
  operationId: "deprecated.verifyKey",
  "x-speakeasy-ignore": true,
  method: "get",
  path: "/v1/test/{test}",
  request: {
    params: z.object({
      test: z.string().optional().openapi({
        description: "The test parameter",
        example: "test",
      }),
    }),
  },
  responses: {
    200: {
      description: "The verification result",
      content: {
        "application/json": {
          schema: z.object({
            test: z.string().optional().openapi({
              description: "The test parameter",
              example: "test",
            }),
          }),
        },
      },
    },
    ...openApiErrorResponses,
  },
})

export type TestRequest = z.infer<typeof route.request.params>
export type TestResponse = z.infer<
  (typeof route.responses)[200]["content"]["application/json"]["schema"]
>
export const registerTest = (app: App) =>
  app.openapi(route, async (c) => {
    const { apikey } = c.get("services")

    const data = await apikey.verifyApiKey(c, {
      key: "unprice_live_1GbNo9pqXPXzMaf6X9SYn",
    })

    return c.json({ test: c.req.param("test") ?? "", data }, 200)
  })

// TODO: check this https://github.com/w3cj/hono-open-api-starter/blob/main/src/routes/tasks/tasks.routes.ts
// https://github.com/w3cj/monorepo-example-tasks-app/blob/main/apps/api/src/lib/create-router.ts
