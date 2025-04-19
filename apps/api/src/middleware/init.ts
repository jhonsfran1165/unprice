import { createConnection } from "@unprice/db"
import { newId } from "@unprice/db/utils"
import { ConsoleLogger } from "@unprice/logging"
import { CacheService } from "@unprice/services/cache"
import { CustomerService } from "@unprice/services/customers"
import { LogdrainMetrics, NoopMetrics } from "@unprice/services/metrics"
import type { Metrics } from "@unprice/services/metrics"
import { Analytics } from "@unprice/tinybird"
import type { MiddlewareHandler } from "hono"
import { ApiKeysService } from "~/apikey/service"
import { EntitlementService } from "~/entitlement/service"
import type { HonoEnv } from "~/hono/env"
import { ApiProjectService } from "~/project"
/**
 * These maps persist between worker executions and are used for caching
 */
// const rlMap = new Map()

/**
 * workerId and isolateCreatedAt are used to track the lifetime of the worker
 * and are set once when the worker is first initialized.
 *
 * subsequent requests will use the same workerId and isolateCreatedAt
 */
let isolateId: string | undefined = undefined
let isolateCreatedAt: number | undefined = undefined

/**
 * Initialize all services.
 *
 * Call this once before any hono handlers run.
 */
export function init(): MiddlewareHandler<HonoEnv> {
  return async (c, next) => {
    if (!isolateId) {
      isolateId = newId("isolate")
      isolateCreatedAt = Date.now()
    }

    if (!isolateCreatedAt) {
      isolateCreatedAt = Date.now()
    }

    const requestId = newId("request")
    const requestStartedAt = Date.now()
    const performanceStart = performance.now()

    c.set("isolateId", isolateId)
    c.set("isolateCreatedAt", isolateCreatedAt)
    c.set("requestId", requestId)
    c.set("requestStartedAt", requestStartedAt)
    c.set("performanceStart", performanceStart)

    // Set request ID header
    c.res.headers.set("unprice-request-id", requestId)

    // const logger =
    //   c.env.EMIT_METRICS_LOGS && c.env.NODE_ENV !== "development"
    //     ? new BaseLimeLogger({
    //         apiKey: c.env.BASELIME_APIKEY,
    //         requestId,
    //         defaultFields: {
    //           isolateId: c.get("isolateId"),
    //           isolateCreatedAt: c.get("isolateCreatedAt"),
    //           requestId: c.get("requestId"),
    //           requestStartedAt: c.get("requestStartedAt"),
    //           performanceStart: c.get("performanceStart"),
    //           location: c.get("location"),
    //           workspaceId: c.get("workspaceId"),
    //           projectId: c.get("projectId"),
    //           userAgent: c.get("userAgent"),
    //         },
    //         namespace: "unprice-api",
    //         dataset: "unprice-api",
    //         service: "api", // default service name
    //         flushAfterMs: 5000, // flush after 5 secs
    //         ctx: {
    //           waitUntil: c.executionCtx.waitUntil.bind(c.executionCtx),
    //         },
    //         environment: c.env.NODE_ENV,
    //         application: "api",
    //       })
    //     : new ConsoleLogger({
    //         requestId,
    //         environment: c.env.NODE_ENV,
    //         application: "api",
    //         defaultFields: {
    //           isolateId: c.get("isolateId"),
    //           isolateCreatedAt: c.get("isolateCreatedAt"),
    //           requestId: c.get("requestId"),
    //           requestStartedAt: c.get("requestStartedAt"),
    //           performanceStart: c.get("performanceStart"),
    //         },
    //       })

    // TODO: remove this once we have a logger that supports logpush
    // https://baselime.io/docs/sending-data/platforms/cloudflare/logpush/
    const logger =
      c.env.EMIT_METRICS_LOGS && c.env.NODE_ENV !== "development"
        ? new ConsoleLogger({
            requestId,
            environment: c.env.NODE_ENV,
            application: "api",
            defaultFields: {
              isolateId: c.get("isolateId"),
              isolateCreatedAt: c.get("isolateCreatedAt"),
              requestId: c.get("requestId"),
              requestStartedAt: c.get("requestStartedAt"),
              performanceStart: c.get("performanceStart"),
            },
          })
        : new ConsoleLogger({
            requestId,
            environment: c.env.NODE_ENV,
            application: "api",
            defaultFields: {
              isolateId: c.get("isolateId"),
              isolateCreatedAt: c.get("isolateCreatedAt"),
              requestId: c.get("requestId"),
              requestStartedAt: c.get("requestStartedAt"),
              performanceStart: c.get("performanceStart"),
            },
          })

    const loggerTime = performanceStart - performance.now()

    const metrics: Metrics = c.env.EMIT_METRICS_LOGS
      ? new LogdrainMetrics({
          requestId,
          environment: c.env.NODE_ENV,
          logger,
          application: "api",
        })
      : new NoopMetrics()

    const metricsTime = performanceStart - performance.now()
    const cacheService = new CacheService(
      {
        waitUntil: c.executionCtx.waitUntil.bind(c.executionCtx),
      },
      metrics
    )

    const cacheTime = performanceStart - performance.now()
    await cacheService.init()
    const cacheInitTime = performanceStart - performance.now()
    const cache = cacheService.getCache()

    const db = createConnection({
      env: c.env.NODE_ENV,
      primaryDatabaseUrl: c.env.DATABASE_URL,
      read1DatabaseUrl: c.env.DATABASE_READ1_URL,
      read2DatabaseUrl: c.env.DATABASE_READ2_URL,
      logger: c.env.DRIZZLE_LOG || false,
    })

    const dbTime = performanceStart - performance.now()

    const analytics = new Analytics({
      emit: c.env.EMIT_METRICS_LOGS,
      tinybirdToken: c.env.TINYBIRD_TOKEN,
      tinybirdUrl: c.env.TINYBIRD_URL,
    })

    const analyticsTime = performanceStart - performance.now()

    const customer = new CustomerService({
      logger,
      analytics,
      waitUntil: c.executionCtx.waitUntil.bind(c.executionCtx),
      cache,
      metrics,
      db,
    })

    const customerTime = performanceStart - performance.now()

    const entitlement = new EntitlementService({
      namespace: c.env.usagelimit,
      requestId,
      logger,
      metrics,
      analytics,
      cache,
      db,
      waitUntil: c.executionCtx.waitUntil.bind(c.executionCtx),
      customer,
    })

    const entitlementTime = performanceStart - performance.now()

    const project = new ApiProjectService({
      cache,
      analytics,
      logger,
      metrics,
      waitUntil: c.executionCtx.waitUntil.bind(c.executionCtx),
      db,
      requestId,
    })

    const projectInitTime = performanceStart - performance.now()

    const apikey = new ApiKeysService({
      cache,
      analytics,
      logger,
      metrics,
      db,
    })

    const apikeyInitTime = performanceStart - performance.now()

    c.set("services", {
      version: "1.0.0",
      entitlement,
      analytics,
      project,
      cache,
      logger,
      metrics,
      apikey,
      db,
      customer,
    })

    try {
      await next()
    } finally {
      metrics.emit({
        metric: "metric.init",
        duration: {
          database: dbTime,
          metrics: metricsTime,
          cacheTime: cacheInitTime,
          cache: cacheTime,
          logger: loggerTime,
          analytics: analyticsTime,
          entitlement: entitlementTime,
          project: projectInitTime,
          apikey: apikeyInitTime,
          customer: customerTime,
        },
      })
    }
  }
}
