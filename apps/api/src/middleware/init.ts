import { db } from "@unprice/db"
import { newId } from "@unprice/id"
import { ConsoleLogger } from "@unprice/logging"
import { CacheService } from "@unprice/services/cache"
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
      isolateId = crypto.randomUUID()
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

    // TODO: define proper logger
    const logger = new ConsoleLogger({
      requestId,
      application: "api",
      environment: c.env.NODE_ENV,
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

    const analytics = new Analytics({
      emit: c.env.EMIT_METRICS_LOGS,
      tinybirdToken: c.env.TINYBIRD_TOKEN,
      tinybirdUrl: c.env.TINYBIRD_URL,
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
    })

    await next()
  }
}
