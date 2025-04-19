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

// At the top of init.ts, create singleton instances
let db: ReturnType<typeof createConnection>
let analytics: Analytics
let cacheService: CacheService

// Initialize core services once
function initializeGlobalServices(env: HonoEnv["Bindings"]) {
  if (!db) {
    db = createConnection({
      env: env.NODE_ENV,
      primaryDatabaseUrl: env.DATABASE_URL,
      read1DatabaseUrl: env.DATABASE_READ1_URL,
      read2DatabaseUrl: env.DATABASE_READ2_URL,
      logger: env.DRIZZLE_LOG || false,
    })
  }

  if (!analytics) {
    analytics = new Analytics({
      emit: env.EMIT_METRICS_LOGS,
      tinybirdToken: env.TINYBIRD_TOKEN,
      tinybirdUrl: env.TINYBIRD_URL,
    })
  }

  if (!cacheService) {
    cacheService = new CacheService(
      {
        waitUntil: () => {}, // Default no-op, will be overridden per-request
      },
      new NoopMetrics() // Default metrics, will be overridden per-request
    )
  }
}

/**
 * Initialize all services.
 *
 * Call this once before any hono handlers run.
 */
export function init(): MiddlewareHandler<HonoEnv> {
  return async (c, next) => {
    // Initialize global services if not already done
    initializeGlobalServices(c.env)

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

    const metrics: Metrics = c.env.EMIT_METRICS_LOGS
      ? new LogdrainMetrics({
          requestId,
          environment: c.env.NODE_ENV,
          logger,
          application: "api",
        })
      : new NoopMetrics()

    // Update cache service with request-specific context
    cacheService.updateContext({
      waitUntil: c.executionCtx.waitUntil.bind(c.executionCtx),
      metrics,
    })

    await cacheService.init()
    const cache = cacheService.getCache()

    const customer = new CustomerService({
      logger,
      analytics,
      waitUntil: c.executionCtx.waitUntil.bind(c.executionCtx),
      cache,
      metrics,
      db,
    })

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

    const project = new ApiProjectService({
      cache,
      analytics,
      logger,
      metrics,
      waitUntil: c.executionCtx.waitUntil.bind(c.executionCtx),
      db,
      requestId,
    })

    const apikey = new ApiKeysService({
      cache,
      analytics,
      logger,
      metrics,
      db,
    })

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
      // Log request duration
      const duration = performance.now() - c.get("performanceStart")
      metrics.emit({
        metric: "metric.init",
        duration,
      })
    }
  }
}
