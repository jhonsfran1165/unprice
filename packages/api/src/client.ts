import { version } from "../package.json"
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

  /**
   * Additional headers to send with the request
   */
  headers?: Record<string, string>
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
  private readonly headers?: Record<string, string>
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

    this.headers = opts.headers ?? {}
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
      "unprice-request-source": `sdk@${version}`,
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
    return { ...headers, ...this.headers }
  }

  private async fetch<TResult>(req: ApiRequest): Promise<Result<TResult>> {
    let res: Response | null = null
    let err: Error | null = null
    for (let i = 0; i <= this.retry.attempts; i++) {
      const url = new URL(`${this.baseUrl}/${req.path.join("/")}`)

      const optionsRequest = {
        method: req.method,
        headers: this.getHeaders(),
        cache: this.cache,
      } as RequestInit

      if (req.query) {
        for (const [k, v] of Object.entries(req.query)) {
          if (typeof v === "undefined" || v === null) {
            continue
          }
          url.searchParams.set(k, v.toString())
        }
      }

      if (req.body) {
        optionsRequest.body = JSON.stringify(req.body)
      }

      res = await fetch(url, optionsRequest).catch((e: Error) => {
        err = e
        return null // set `res` to `null`
      })

      // 200-299 -> success
      if (res && res.status >= 200 && res.status <= 299) {
        return { result: (await res.json()) as TResult }
      }

      // 400-499 -> client error, retries are futile
      if (res && res.status >= 400 && res.status <= 499) {
        return (await res.json()) as ErrorResponse
      }

      const backoff = this.retry.backoff(i)

      console.debug(
        `attempt ${i + 1} of ${
          this.retry.attempts + 1
        } to reach ${url} failed, retrying in ${backoff} ms: status=${
          res?.status
        } | ${res?.headers.get("unprice-request-id")}`
      )

      await new Promise((r) => setTimeout(r, backoff))
    }

    if (res) {
      return (await res.json()) as ErrorResponse
    }

    return {
      error: {
        // @ts-ignore
        code: "FETCH_ERROR",
        // @ts-ignore I don't understand why `err` is `never`
        message: err?.message ?? "No response",
        docs: "https://developer.mozilla.org/en-US/docs/Web/API/fetch",
        requestId: "N/A",
      },
    }
  }

  public get customers() {
    return {
      reportUsage: async (
        req: paths["/v1/customer/reportUsage"]["post"]["requestBody"]["content"]["application/json"]
      ): Promise<
        Result<
          paths["/v1/customer/reportUsage"]["post"]["responses"]["200"]["content"]["application/json"]
        >
      > => {
        return await this.fetch({
          path: ["v1", "customer", "reportUsage"],
          method: "POST",
          body: req,
        })
      },

      getEntitlements: async (
        customerId: string
      ): Promise<
        Result<
          paths["/v1/customer/{customerId}/getEntitlements"]["get"]["responses"]["200"]["content"]["application/json"]
        >
      > => {
        return await this.fetch({
          path: ["v1", "customer", customerId, "getEntitlements"],
          method: "GET",
        })
      },

      getSubscription: async (
        customerId: string
      ): Promise<
        Result<
          paths["/v1/customer/{customerId}/getSubscription"]["get"]["responses"]["200"]["content"]["application/json"]
        >
      > => {
        return await this.fetch({
          path: ["v1", "customer", customerId, "getSubscription"],
          method: "GET",
        })
      },

      getPlanVersion: async (
        planVersionId: string
      ): Promise<
        Result<
          paths["/v1/plans/getPlanVersion/{planVersionId}"]["get"]["responses"]["200"]["content"]["application/json"]
        >
      > => {
        return await this.fetch({
          path: ["v1", "plans", "getPlanVersion", planVersionId],
          method: "GET",
        })
      },

      resetEntitlements: async (
        req: paths["/v1/customer/reset-entitlements"]["post"]["requestBody"]["content"]["application/json"]
      ): Promise<
        Result<
          paths["/v1/customer/reset-entitlements"]["post"]["responses"]["200"]["content"]["application/json"]
        >
      > => {
        return await this.fetch({
          path: ["v1", "customer", "reset-entitlements"],
          method: "POST",
          body: req,
        })
      },

      can: async (
        req: paths["/v1/customer/can"]["post"]["requestBody"]["content"]["application/json"]
      ): Promise<
        Result<paths["/v1/customer/can"]["post"]["responses"]["200"]["content"]["application/json"]>
      > => {
        return await this.fetch({
          path: ["v1", "customer", "can"],
          method: "POST",
          body: req,
        })
      },

      getActivePhase: async (
        customerId: string
      ): Promise<
        Result<
          paths["/v1/customer/{customerId}/getActivePhase"]["get"]["responses"]["200"]["content"]["application/json"]
        >
      > => {
        return await this.fetch({
          path: ["v1", "customer", customerId, "getActivePhase"],
          method: "GET",
        })
      },

      getUsage: async (
        customerId: string
      ): Promise<
        Result<
          paths["/v1/customer/{customerId}/getUsage"]["get"]["responses"]["200"]["content"]["application/json"]
        >
      > => {
        return await this.fetch({
          path: ["v1", "customer", customerId, "getUsage"],
          method: "GET",
        })
      },

      getPaymentMethods: async (
        req: paths["/v1/customer/getPaymentMethods"]["post"]["requestBody"]["content"]["application/json"]
      ): Promise<
        Result<
          paths["/v1/customer/getPaymentMethods"]["post"]["responses"]["200"]["content"]["application/json"]
        >
      > => {
        return await this.fetch({
          path: ["v1", "customer", "getPaymentMethods"],
          method: "POST",
          body: req,
        })
      },

      createPaymentMethod: async (
        req: paths["/v1/customer/createPaymentMethod"]["post"]["requestBody"]["content"]["application/json"]
      ): Promise<
        Result<
          paths["/v1/customer/createPaymentMethod"]["post"]["responses"]["200"]["content"]["application/json"]
        >
      > => {
        return await this.fetch({
          path: ["v1", "customer", "createPaymentMethod"],
          method: "POST",
          body: req,
        })
      },

      signUp: async (
        req: paths["/v1/customer/signUp"]["post"]["requestBody"]["content"]["application/json"]
      ): Promise<
        Result<
          paths["/v1/customer/signUp"]["post"]["responses"]["200"]["content"]["application/json"]
        >
      > => {
        return await this.fetch({
          path: ["v1", "customer", "signUp"],
          method: "POST",
          body: req,
        })
      },
    }
  }

  public get projects() {
    return {
      getFeatures: async (): Promise<
        Result<
          paths["/v1/project/getFeatures"]["get"]["responses"]["200"]["content"]["application/json"]
        >
      > => {
        return await this.fetch({
          path: ["v1", "project", "getFeatures"],
          method: "GET",
        })
      },
    }
  }

  public get plans() {
    return {
      listPlanVersions: async (
        req: paths["/v1/plans/listPlanVersions"]["post"]["requestBody"]["content"]["application/json"]
      ): Promise<
        Result<
          paths["/v1/plans/listPlanVersions"]["post"]["responses"]["200"]["content"]["application/json"]
        >
      > => {
        return await this.fetch({
          path: ["v1", "plans", "listPlanVersions"],
          method: "POST",
          body: req,
        })
      },
      getPlanVersion: async (
        planVersionId: string
      ): Promise<
        Result<
          paths["/v1/plans/getPlanVersion/{planVersionId}"]["get"]["responses"]["200"]["content"]["application/json"]
        >
      > => {
        return await this.fetch({
          path: ["v1", "plans", "getPlanVersion", planVersionId],
          method: "GET",
        })
      },
    }
  }

  public get analytics() {
    return {
      getUsage: async (
        req: paths["/v1/analytics/usage"]["post"]["requestBody"]["content"]["application/json"]
      ): Promise<
        Result<
          paths["/v1/analytics/usage"]["post"]["responses"]["200"]["content"]["application/json"]
        >
      > => {
        return await this.fetch({
          path: ["v1", "analytics", "usage"],
          method: "POST",
          body: req,
        })
      },

      track: async (
        action: string,
        req: paths["/v1/analytics/track/{action}"]["post"]["requestBody"]["content"]["application/json"]
      ): Promise<
        Result<
          paths["/v1/analytics/track/{action}"]["post"]["responses"]["200"]["content"]["application/json"]
        >
      > => {
        return await this.fetch({
          path: ["v1", "analytics", action],
          method: "POST",
          body: req,
        })
      },

      getVerifications: async (
        req: paths["/v1/analytics/verifications"]["post"]["requestBody"]["content"]["application/json"]
      ): Promise<
        Result<
          paths["/v1/analytics/verifications"]["post"]["responses"]["200"]["content"]["application/json"]
        >
      > => {
        return await this.fetch({
          path: ["v1", "analytics", "verifications"],
          method: "POST",
          body: req,
        })
      },
    }
  }
}
