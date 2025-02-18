import type { SuperJSONResult } from "superjson"
import superjson from "superjson"

import type { ErrorResponse } from "./errors"
import type { paths } from "./openapi"
import type { Telemetry } from "./telemetry"
import { getTelemetry } from "./telemetry"

export type UnpriceOptions = {
  token: string
} & {
  /**
   * @default https://api.unprice.dev
   */
  baseUrl?: string

  /**
   *
   * By default telemetry data is enabled, and sends:
   * runtime (Node.js / Edge)
   * platform (Node.js / Vercel / AWS)
   * SDK version
   */
  disableTelemetry?: boolean

  /**
   * Retry on network errors
   */
  retry?: {
    /**
     * How many attempts should be made
     * The maximum number of requests will be `attempts + 1`
     * `0` means no retries
     *
     * @default 5
     */
    attempts?: number
    /**
     * Return how many milliseconds to wait until the next attempt is made
     *
     * @default `(retryCount) => Math.round(Math.exp(retryCount) * 10)),`
     */
    backoff?: (retryCount: number) => number
  }
  /**
   * Customize the `fetch` cache behaviour
   */
  cache?: RequestCache

  /**
   * The version of the SDK instantiating this client.
   *
   * This is used for internal metrics and is not covered by semver, and may change at any time.
   *
   * You can leave this blank unless you are building a wrapper around this SDK.
   */
  wrapperSdkVersion?: string
}

type ApiRequest = {
  path: string[]
} & (
  | {
      method: "GET"
      body?: never
      query?: Record<string, string | number | boolean | null>
    }
  | {
      method: "POST"
      body?: unknown
      query?: never
    }
)

type Result<R> =
  | {
      result: R
      error?: never
    }
  | {
      result?: never
      error: ErrorResponse["error"]
    }

export class Unprice {
  private readonly baseUrl: string
  private readonly token: string
  private readonly cache?: RequestCache
  private readonly telemetry?: Telemetry | null

  public readonly retry: {
    attempts: number
    backoff: (retryCount: number) => number
  }

  constructor(opts: UnpriceOptions) {
    this.baseUrl = opts.baseUrl ?? "https://api.unprice.dev"
    this.token = opts.token
    if (!opts.disableTelemetry) {
      this.telemetry = getTelemetry(opts)
    }

    this.cache = opts.cache ?? "default"
    /**
     * Even though typescript should prevent this, some people still pass undefined or empty strings
     */
    if (!this.token) {
      throw new Error(
        "unprice root key must be set, maybe you passed in `undefined` or an empty string?"
      )
    }

    this.retry = {
      attempts: opts.retry?.attempts ?? 2,
      backoff: opts.retry?.backoff ?? ((n) => Math.round(Math.exp(n) * 10)),
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.token}`,
      "x-trpc-source": "sdk", // TODO: add version here
    }
    if (this.telemetry?.sdkVersions) {
      headers["Unprice-Telemetry-SDK"] = this.telemetry.sdkVersions.join(",")
    }
    if (this.telemetry?.platform) {
      headers["Unprice-Telemetry-Platform"] = this.telemetry.platform
    }
    if (this.telemetry?.runtime) {
      headers["Unprice-Telemetry-Runtime"] = this.telemetry.runtime
    }
    return headers
  }

  private async fetch<TResult>(req: ApiRequest): Promise<Result<TResult>> {
    let res: Response | null = null
    let err: Error | null = null
    for (let i = 0; i <= this.retry.attempts; i++) {
      const url = new URL(`${this.baseUrl}/trpc/${req.path.join("/")}`)

      const optionsRequest = {
        method: req.method,
        headers: this.getHeaders(),
        cache: this.cache,
      } as RequestInit

      if (req.query) {
        // expected input for trpc
        const inputString = superjson.serialize(req.query)
        const stringifyRequest = JSON.stringify({ 0: inputString })

        const encodedParams = `batch=1&input=${encodeURIComponent(stringifyRequest)}`

        url.search = encodedParams
      }

      if (req.body) {
        optionsRequest.body = superjson.stringify(req.body)
      }

      res = await fetch(url, optionsRequest).catch((e: Error) => {
        err = e
        return null // set `res` to `null`
      })

      if (res?.ok) {
        const response = (await res.json()) as Result<{
          data: SuperJSONResult
        }>

        const data = Array.isArray(response) ? response?.at(0).result?.data : response?.result?.data
        const result = data ? superjson.deserialize(data) : {}

        return { result: result as TResult }
      }

      const backoff = this.retry.backoff(i)

      console.debug(
        "attempt %d of %d to reach %s failed, retrying in %d ms: %s",
        i + 1,
        this.retry.attempts + 1,
        url,
        backoff,
        // @ts-expect-error I don't understand why `err` is `never`
        err?.message
      )

      await new Promise((r) => setTimeout(r, backoff))
    }

    if (res) {
      return { error: (await res.json()) as ErrorResponse["error"] }
    }

    return {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        // @ts-expect-error I don't understand why `err` is `never`
        message: JSON.stringify(err?.message) ?? "No response",
        docs: "https://developer.mozilla.org/en-US/docs/Web/API/fetch",
        requestId: "N/A",
      },
    }
  }

  public get customers() {
    return {
      create: async (
        req: paths["/lambda/customers.create"]["post"]["requestBody"]["content"]["application/json"]
      ): Promise<
        Result<
          paths["/lambda/customers.create"]["post"]["responses"]["200"]["content"]["application/json"]
        >
      > => {
        return await this.fetch({
          path: ["lambda", "customers.create"],
          method: "POST",
          body: req,
        })
      },

      update: async (
        req: paths["/lambda/customers.update"]["post"]["requestBody"]["content"]["application/json"]
      ): Promise<
        Result<
          paths["/lambda/customers.update"]["post"]["responses"]["200"]["content"]["application/json"]
        >
      > => {
        return await this.fetch({
          path: ["lambda", "customers.update"],
          method: "POST",
          body: req,
        })
      },

      remove: async (
        req: paths["/lambda/customers.remove"]["post"]["requestBody"]["content"]["application/json"]
      ): Promise<
        Result<
          paths["/lambda/customers.remove"]["post"]["responses"]["200"]["content"]["application/json"]
        >
      > => {
        return await this.fetch({
          path: ["lambda", "customers.remove"],
          method: "POST",
          body: req,
        })
      },

      exist: async (
        req: paths["/lambda/customers.exist"]["post"]["requestBody"]["content"]["application/json"]
      ): Promise<
        Result<
          paths["/lambda/customers.exist"]["post"]["responses"]["200"]["content"]["application/json"]
        >
      > => {
        return await this.fetch({
          path: ["lambda", "customers.exist"],
          method: "POST",
          body: req,
        })
      },

      signUp: async (
        req: paths["/edge/customers.signUp"]["post"]["requestBody"]["content"]["application/json"]
      ): Promise<
        Result<
          paths["/edge/customers.signUp"]["post"]["responses"]["200"]["content"]["application/json"]
        >
      > => {
        return await this.fetch({
          path: ["edge", "customers.signUp"],
          method: "POST",
          body: req,
        })
      },

      signOut: async (
        req: paths["/edge/customers.signOut"]["post"]["requestBody"]["content"]["application/json"]
      ): Promise<
        Result<
          paths["/edge/customers.signOut"]["post"]["responses"]["200"]["content"]["application/json"]
        >
      > => {
        return await this.fetch({
          path: ["edge", "customers.signOut"],
          method: "POST",
          body: req,
        })
      },

      getByEmail: async (
        req: paths["/lambda/customers.getByEmail"]["get"]["parameters"]["query"]
      ): Promise<
        Result<
          paths["/lambda/customers.getByEmail"]["get"]["responses"]["200"]["content"]["application/json"]
        >
      > => {
        return await this.fetch({
          path: ["lambda", "customers.getByEmail"],
          method: "GET",
          query: req,
        })
      },

      getSubscriptions: async (
        req: paths["/lambda/customers.getSubscriptions"]["get"]["parameters"]["query"]
      ): Promise<
        Result<
          paths["/lambda/customers.getSubscriptions"]["get"]["responses"]["200"]["content"]["application/json"]
        >
      > => {
        return await this.fetch({
          path: ["lambda", "customers.getSubscriptions"],
          method: "GET",
          query: req,
        })
      },

      entitlements: async (
        req: paths["/edge/customers.entitlements"]["get"]["parameters"]["query"]
      ): Promise<
        Result<
          paths["/edge/customers.entitlements"]["get"]["responses"]["200"]["content"]["application/json"]
        >
      > => {
        return await this.fetch({
          path: ["edge", "customers.entitlements"],
          method: "GET",
          query: req,
        })
      },

      listPaymentMethods: async (
        req: paths["/edge/customers.listPaymentMethods"]["get"]["parameters"]["query"]
      ): Promise<
        Result<
          paths["/edge/customers.listPaymentMethods"]["get"]["responses"]["200"]["content"]["application/json"]
        >
      > => {
        return await this.fetch({
          path: ["edge", "customers.listPaymentMethods"],
          method: "GET",
          query: req,
        })
      },

      createPaymentMethod: async (
        req: paths["/lambda/customers.createPaymentMethod"]["post"]["requestBody"]["content"]["application/json"]
      ): Promise<
        Result<
          paths["/lambda/customers.createPaymentMethod"]["post"]["responses"]["200"]["content"]["application/json"]
        >
      > => {
        return await this.fetch({
          path: ["lambda", "customers.createPaymentMethod"],
          method: "GET",
          query: req,
        })
      },

      can: async (
        req: paths["/edge/customers.can"]["get"]["parameters"]["query"]
      ): Promise<
        Result<
          paths["/edge/customers.can"]["get"]["responses"]["200"]["content"]["application/json"]
        >
      > => {
        return await this.fetch({
          path: ["edge", "customers.can"],
          method: "GET",
          query: req,
        })
      },

      reportUsage: async (
        req: paths["/edge/customers.reportUsage"]["get"]["parameters"]["query"]
      ): Promise<
        Result<
          paths["/edge/customers.reportUsage"]["get"]["responses"]["200"]["content"]["application/json"]
        >
      > => {
        return await this.fetch({
          path: ["edge", "customers.reportUsage"],
          method: "GET",
          query: req,
        })
      },

      getByIdActiveProject: async (
        req: paths["/lambda/customers.getByIdActiveProject"]["get"]["parameters"]["query"]
      ): Promise<
        Result<
          paths["/lambda/customers.getByIdActiveProject"]["get"]["responses"]["200"]["content"]["application/json"]
        >
      > => {
        return await this.fetch({
          path: ["lambda", "customers.getByIdActiveProject"],
          method: "GET",
          query: req,
        })
      },
    }
  }
}
