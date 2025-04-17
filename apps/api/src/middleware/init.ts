import { createConnection } from "@unprice/db"
import { newId } from "@unprice/db/utils"
import { BaseLimeLogger, ConsoleLogger } from "@unprice/logging"
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
    }

    if (!isolateCreatedAt) {
      isolateCreatedAt = Date.now()
    }

    c.set("isolateId", isolateId)
    c.set("isolateCreatedAt", isolateCreatedAt)

    const requestId = newId("request")
    c.set("requestId", requestId)

    c.set("requestStartedAt", Date.now())
    c.set("performanceStart", performance.now())

    c.res.headers.set("unprice-request-id", requestId)

    const logger =
      c.env.EMIT_METRICS_LOGS && c.env.NODE_ENV !== "development"
        ? new BaseLimeLogger({
            apiKey: c.env.BASELIME_APIKEY,
            requestId,
            defaultFields: {
              isolateId: c.get("isolateId"),
              isolateCreatedAt: c.get("isolateCreatedAt"),
              requestId: c.get("requestId"),
              requestStartedAt: c.get("requestStartedAt"),
              performanceStart: c.get("performanceStart"),
              location: c.get("location"),
              workspaceId: c.get("workspaceId"),
              projectId: c.get("projectId"),
              userAgent: c.get("userAgent"),
            },
            namespace: "unprice-api",
            dataset: "unprice-api",
            service: "api", // default service name
            flushAfterMs: 3000, // flush after 3 secs
            ctx: {
              waitUntil: c.executionCtx.waitUntil.bind(c.executionCtx),
            },
            environment: c.env.NODE_ENV,
            application: "api",
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

    const cacheService = new CacheService(
      {
        waitUntil: c.executionCtx.waitUntil.bind(c.executionCtx),
      },
      metrics
    )

    await cacheService.init()
    const cache = cacheService.getCache()

    const db = createConnection({
      env: c.env.NODE_ENV,
      primaryDatabaseUrl: c.env.DATABASE_URL,
      read1DatabaseUrl: c.env.DATABASE_READ1_URL,
      read2DatabaseUrl: c.env.DATABASE_READ2_URL,
      logger: c.env.DRIZZLE_LOG,
    })

    const analytics = new Analytics({
      emit: c.env.EMIT_METRICS_LOGS,
      tinybirdToken: c.env.TINYBIRD_TOKEN,
      tinybirdUrl: c.env.TINYBIRD_URL,
    })

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

    await next()
  }
}
