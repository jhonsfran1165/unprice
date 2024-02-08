import { generateOpenApiDocument } from "@potatohd/trpc-openapi"
import type { OpenAPIV3 } from "openapi-types"

import { appRouter } from "@builderai/api"

export type IExtensionName = `x-${string}`
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IExtensionType = any
export type ISpecificationExtension = Record<IExtensionName, IExtensionType>
export type ExtendedDocument = OpenAPIV3.Document & ISpecificationExtension

const openApiDocument = generateOpenApiDocument(appRouter, {
  title: "tRPC OpenAPI",
  version: "1.0.0",
  baseUrl: "http://app.localhost:3000/api/trpc",
  description: "API for Builderai",
  docsUrl: "http://example.com/docs",
  tags: ["builderai"],
})

openApiDocument.tags = [
  {
    name: "builderai",
    description: "Operations related to builderai",
  },
]

openApiDocument.components = {
  ...openApiDocument.components,
  schemas: openApiDocument?.components?.schemas ?? {},
}
;(openApiDocument as ExtendedDocument)["x-speakeasy-retries"] = {
  strategy: "backoff",
  backoff: {
    initialInterval: 500,
    maxInterval: 60000,
    maxElapsedTime: 3600000,
    exponent: 1.5,
  },
  statusCodes: ["5XX"],
  retryConnectionErrors: true,
}

export { openApiDocument }
