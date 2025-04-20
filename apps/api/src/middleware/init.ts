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

import { endTime, startTime } from "hono/timing"

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

    // start a new timer
    startTime(c, "initLogger")

    const logger = new ConsoleLogger({
      requestId,
      environment: c.env.NODE_ENV,
      application: "api",
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
        path: c.req.path,
      },
    })

    endTime(c, "initLogger")

    // start a new timer
    startTime(c, "initMetrics")

    const metrics: Metrics = c.env.EMIT_METRICS_LOGS
      ? new LogdrainMetrics({
          requestId,
          environment: c.env.NODE_ENV,
          logger,
          application: "api",
        })
      : new NoopMetrics()

    endTime(c, "initMetrics")

    // start a new timer
    startTime(c, "initCache")

    const cacheService = new CacheService(
      {
        waitUntil: c.executionCtx.waitUntil.bind(c.executionCtx),
      },
      metrics,
      c.env.EMIT_METRICS_LOGS
    )

    await cacheService.init()
    const cache = cacheService.getCache()

    endTime(c, "initCache")

    // start a new timer
    startTime(c, "initDb")

    const db = createConnection({
      env: c.env.NODE_ENV,
      primaryDatabaseUrl: c.env.DATABASE_URL,
      read1DatabaseUrl: c.env.DATABASE_READ1_URL,
      read2DatabaseUrl: c.env.DATABASE_READ2_URL,
      logger: c.env.DRIZZLE_LOG,
    })

    endTime(c, "initDb")

    // start a new timer
    startTime(c, "initAnalytics")

    const analytics = new Analytics({
      emit: c.env.EMIT_ANALYTICS,
      tinybirdToken: c.env.TINYBIRD_TOKEN,
      tinybirdUrl: c.env.TINYBIRD_URL,
    })

    endTime(c, "initAnalytics")

    // start a new timer
    startTime(c, "initCustomer")

    const customer = new CustomerService({
      logger,
      analytics,
      waitUntil: c.executionCtx.waitUntil.bind(c.executionCtx),
      cache,
      metrics,
      db,
    })

    endTime(c, "initCustomer")

    // start a new timer
    startTime(c, "initEntitlement")

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

    endTime(c, "initEntitlement")

    // start a new timer
    startTime(c, "initProject")

    const project = new ApiProjectService({
      cache,
      analytics,
      logger,
      metrics,
      waitUntil: c.executionCtx.waitUntil.bind(c.executionCtx),
      db,
      requestId,
    })

    endTime(c, "initProject")

    // start a new timer
    startTime(c, "initApikey")

    const apikey = new ApiKeysService({
      cache,
      analytics,
      logger,
      metrics,
      db,
    })

    endTime(c, "initApikey")

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

    // emit the init event
    metrics.emit({
      metric: "metric.init",
      duration: performance.now() - performanceStart,
    })

    try {
      await next()
    } finally {
      metrics.emit({
        metric: "metric.server.latency",
        path: c.req.path,
        platform: "cloudflare",
        status: c.res.status,
        country: (c.req.raw?.cf?.country as string) ?? "unknown",
        continent: (c.req.raw?.cf?.continent as string) ?? "unknown",
        colo: (c.req.raw?.cf?.colo as string) ?? "unknown",
        latency: performance.now() - performanceStart,
      })
    }
  }
}
