import * as HttpStatusCodes from "stoker/http-status-codes"
import { z } from "zod"
import { errorSchemaFactory } from "./http"

export const openApiErrorResponses = {
  [HttpStatusCodes.BAD_REQUEST]: {
    description:
      "The server cannot or will not process the request due to something that is perceived to be a client error (e.g., malformed request syntax, invalid request message framing, or deceptive request routing).",
    content: {
      "application/json": {
        schema: errorSchemaFactory(z.enum(["BAD_REQUEST"])).openapi("ErrBadRequest"),
      },
    },
  },
  [HttpStatusCodes.UNAUTHORIZED]: {
    description: `Although the HTTP standard specifies "unauthorized", semantically this response means "unauthenticated". That is, the client must authenticate itself to get the requested response.`,
    content: {
      "application/json": {
        schema: errorSchemaFactory(z.enum(["UNAUTHORIZED"])).openapi("ErrUnauthorized"),
      },
    },
  },
  [HttpStatusCodes.FORBIDDEN]: {
    description:
      "The client does not have access rights to the content; that is, it is unauthorized, so the server is refusing to give the requested resource. Unlike 401 Unauthorized, the client's identity is known to the server.",
    content: {
      "application/json": {
        schema: errorSchemaFactory(z.enum(["FORBIDDEN"])).openapi("ErrForbidden"),
      },
    },
  },
  [HttpStatusCodes.NOT_FOUND]: {
    description:
      "The server cannot find the requested resource. In the browser, this means the URL is not recognized. In an API, this can also mean that the endpoint is valid but the resource itself does not exist. Servers may also send this response instead of 403 Forbidden to hide the existence of a resource from an unauthorized client. This response code is probably the most well known due to its frequent occurrence on the web.",
    content: {
      "application/json": {
        schema: errorSchemaFactory(z.enum(["NOT_FOUND"])).openapi("ErrNotFound"),
      },
    },
  },
  [HttpStatusCodes.CONFLICT]: {
    description:
      "This response is sent when a request conflicts with the current state of the server.",
    content: {
      "application/json": {
        schema: errorSchemaFactory(z.enum(["CONFLICT"])).openapi("ErrConflict"),
      },
    },
  },
  [HttpStatusCodes.PRECONDITION_FAILED]: {
    description:
      "The requested operation cannot be completed because certain conditions were not met. This typically occurs when a required resource state or version check fails.",
    content: {
      "application/json": {
        schema: errorSchemaFactory(z.enum(["PRECONDITION_FAILED"])).openapi(
          "ErrPreconditionFailed"
        ),
      },
    },
  },
  [HttpStatusCodes.TOO_MANY_REQUESTS]: {
    description: `The user has sent too many requests in a given amount of time ("rate limiting")`,
    content: {
      "application/json": {
        schema: errorSchemaFactory(z.enum(["TOO_MANY_REQUESTS"])).openapi("ErrTooManyRequests"),
      },
    },
  },
  [HttpStatusCodes.INTERNAL_SERVER_ERROR]: {
    description: "The server has encountered a situation it does not know how to handle.",
    content: {
      "application/json": {
        schema: errorSchemaFactory(z.enum(["INTERNAL_SERVER_ERROR"])).openapi(
          "ErrInternalServerError"
        ),
      },
    },
  },
}
