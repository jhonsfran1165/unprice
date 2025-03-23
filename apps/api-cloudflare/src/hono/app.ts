import { OpenAPIHono } from "@hono/zod-openapi"
import { apiReference } from "@scalar/hono-api-reference"
import type { Context as GenericContext } from "hono"
import { handleError, handleZodError } from "~/errors"
import type { HonoEnv } from "~/hono/env"

export function newApp() {
  const app = new OpenAPIHono<HonoEnv>({
    defaultHook: handleZodError,
  })

  app.onError(handleError)
  app.use("*", (c, next) => {
    c.set(
      "location",
      (c.req.header("True-Client-IP") as string) ??
        (c.req.header("CF-Connecting-IP") as string) ??
        (c.req.raw?.cf?.colo as string) ??
        ""
    )
    c.set("userAgent", c.req.header("User-Agent"))

    return next()
  })

  app.doc("/openapi.json", {
    openapi: "3.0.0",
    info: {
      title: "Unprice API",
      version: "1.0.0",
    },
    servers: [
      {
        url: "https://api.unprice.dev",
        description: "Production",
      },
      {
        url: "http://localhost:8787",
        description: "Development",
      },
    ],

    "x-speakeasy-retries": {
      strategy: "backoff",
      backoff: {
        initialInterval: 50, // 50ms
        maxInterval: 1_000, // 1s
        maxElapsedTime: 30_000, // 30s
        exponent: 1.5,
      },
      statusCodes: ["5XX"],
      retryConnectionErrors: true,
    },
  })

  app.get(
    "/reference",
    apiReference({
      layout: "classic",
      defaultHttpClient: {
        targetKey: "shell",
        clientKey: "curl",
      },
      theme: "deepSpace",
      url: "/openapi.json",
      authentication: {
        name: "root key",
        type: "http",
        scheme: "bearer",
        bearerFormat: "root key",
        in: "header",
      },
    })
  )

  app.openAPIRegistry.registerComponent("securitySchemes", "bearerAuth", {
    bearerFormat: "root key",
    type: "http",
    scheme: "bearer",
    "x-speakeasy-example": "UNPRICE_ROOT_KEY",
    description: "The root key for the Unprice API",
    name: "root key",
    in: "header",
  })

  return app
}

export type App = ReturnType<typeof newApp>
export type Context = GenericContext<HonoEnv>
