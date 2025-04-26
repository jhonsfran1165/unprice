import { createRoute } from "@hono/zod-openapi"
import * as HttpStatusCodes from "stoker/http-status-codes"
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers"

import {
  createPaymentMethodResponseSchema,
  createPaymentMethodSchema,
} from "@unprice/db/validators"
import type { z } from "zod"
import { keyAuth } from "~/auth/key"
import { UnpriceApiError } from "~/errors"
import { openApiErrorResponses } from "~/errors/openapi-responses"
import type { App } from "~/hono/app"

const tags = ["customer"]

export const route = createRoute({
  path: "/v1/customer/createPaymentMethod",
  operationId: "customer.createPaymentMethod",
  description: "Create a payment method for a customer",
  method: "post",
  tags,
  request: {
    body: jsonContentRequired(
      createPaymentMethodSchema.openapi({
        description: "The customer create payment method request",
      }),
      "Body of the request"
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      createPaymentMethodResponseSchema,
      "The result of the customer create payment method"
    ),
    ...openApiErrorResponses,
  },
})

export type CreatePaymentMethodRequest = z.infer<
  (typeof route.request.body)["content"]["application/json"]["schema"]
>

export type CreatePaymentMethodResponse = z.infer<
  (typeof route.responses)[200]["content"]["application/json"]["schema"]
>

export const registerCreatePaymentMethodV1 = (app: App) =>
  app.openapi(route, async (c) => {
    const { paymentProvider, customerId, successUrl, cancelUrl } = c.req.valid("json")
    const { customer, db } = c.get("services")

    // validate the request
    const key = await keyAuth(c)

    // get customer data
    const customerData = await db.query.customers.findFirst({
      where: (customer, { and, eq }) =>
        and(eq(customer.id, customerId), eq(customer.projectId, key.projectId)),
    })

    if (!customerData) {
      throw new UnpriceApiError({
        code: "NOT_FOUND",
        message: "Customer not found",
      })
    }

    // get payment provider for the project
    const { err: paymentProviderErr, val: paymentProviderService } =
      await customer.getPaymentProvider({
        projectId: key.projectId,
        provider: paymentProvider,
      })

    if (paymentProviderErr) {
      throw paymentProviderErr
    }

    const { err, val } = await paymentProviderService.createSession({
      customerId: customerId,
      projectId: key.projectId,
      email: customerData.email,
      currency: customerData.defaultCurrency,
      successUrl: successUrl,
      cancelUrl: cancelUrl,
    })

    if (err) {
      throw err
    }

    return c.json(val, HttpStatusCodes.OK)
  })
