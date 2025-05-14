import { createRoute } from "@hono/zod-openapi"
import * as HttpStatusCodes from "stoker/http-status-codes"
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers"

import { customerSignUpSchema, signUpResponseSchema } from "@unprice/db/validators"
import type { z } from "zod"
import { keyAuth } from "~/auth/key"
import { openApiErrorResponses } from "~/errors/openapi-responses"
import type { App } from "~/hono/app"

const tags = ["customer"]

export const route = createRoute({
  path: "/v1/customer/signUp",
  operationId: "customer.signUp",
  description: "Sign up a customer for a project",
  method: "post",
  tags,
  request: {
    body: jsonContentRequired(
      customerSignUpSchema.openapi({
        description: "The customer sign up request",
      }),
      "Body of the request"
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(signUpResponseSchema, "The result of the customer sign up"),
    ...openApiErrorResponses,
  },
})

export type SignUpRequest = z.infer<
  (typeof route.request.body)["content"]["application/json"]["schema"]
>

export type SignUpResponse = z.infer<
  (typeof route.responses)[200]["content"]["application/json"]["schema"]
>

export const registerSignUpV1 = (app: App) =>
  app.openapi(route, async (c) => {
    const {
      email,
      planVersionId,
      successUrl,
      cancelUrl,
      config,
      externalId,
      name,
      timezone,
      defaultCurrency,
      planSlug,
      billingInterval,
    } = c.req.valid("json")
    const { customer } = c.get("services")

    // validate the request
    const key = await keyAuth(c)

    // get payment methods from service
    const result = await customer.signUp({
      input: {
        name,
        timezone,
        defaultCurrency,
        email,
        planVersionId,
        planSlug,
        successUrl,
        cancelUrl,
        config,
        externalId,
        billingInterval,
      },
      projectId: key.projectId,
    })

    if (result.err) {
      throw result.err
    }

    return c.json(result.val, HttpStatusCodes.OK)
  })
