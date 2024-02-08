import type { components } from "./openapi"

interface paths {
  "/v1/liveness": {
    get: {
      responses: {
        /** @description The configured services and their status */
        200: {
          content: {
            "application/json": {
              /** @description The status of the server */
              status: string
              services: {
                /**
                 * @description The name of the connected metrics service
                 * @example AxiomMetrics
                 */
                metrics: string
                /**
                 * @description The name of the connected logger service
                 * @example AxiomLogger or ConsoleLogger
                 */
                logger: string
                /** @description The name of the connected ratelimit service */
                ratelimit: string
                /** @description The name of the connected usagelimit service */
                usagelimit: string
                /** @description The name of the connected analytics service */
                analytics: string
              }
            }
          }
        }
        /** @description The server cannot or will not process the request due to something that is perceived to be a client error (e.g., malformed request syntax, invalid request message framing, or deceptive request routing). */
        400: {
          content: {
            "application/json": components["schemas"]["ErrBadRequest"]
          }
        }
        /** @description Although the HTTP standard specifies "unauthorized", semantically this response means "unauthenticated". That is, the client must authenticate itself to get the requested response. */
        401: {
          content: {
            "application/json": components["schemas"]["ErrUnauthorized"]
          }
        }
        /** @description The client does not have access rights to the content; that is, it is unauthorized, so the server is refusing to give the requested resource. Unlike 401 Unauthorized, the client's identity is known to the server. */
        403: {
          content: {
            "application/json": components["schemas"]["ErrForbidden"]
          }
        }
        /** @description The server cannot find the requested resource. In the browser, this means the URL is not recognized. In an API, this can also mean that the endpoint is valid but the resource itself does not exist. Servers may also send this response instead of 403 Forbidden to hide the existence of a resource from an unauthorized client. This response code is probably the most well known due to its frequent occurrence on the web. */
        404: {
          content: {
            "application/json": components["schemas"]["ErrNotFound"]
          }
        }
        /** @description This response is sent when a request conflicts with the current state of the server. */
        409: {
          content: {
            "application/json": components["schemas"]["ErrConflict"]
          }
        }
        /** @description The user has sent too many requests in a given amount of time ("rate limiting") */
        429: {
          content: {
            "application/json": components["schemas"]["ErrTooManyRequests"]
          }
        }
        /** @description The server has encountered a situation it does not know how to handle. */
        500: {
          content: {
            "application/json": components["schemas"]["ErrInternalServerError"]
          }
        }
      }
    }
  }
}
// this is what a json body response looks like
export type ErrorResponse =
  paths["/v1/liveness"]["get"]["responses"]["500"]["content"]["application/json"]
