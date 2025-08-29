import { Analytics } from "@unprice/analytics"
import { newId } from "@unprice/db/utils"
import { ConsoleLogger } from "@unprice/logging"
import { CacheService, redis as upstashRedis } from "@unprice/services/cache"
import { CustomerService } from "@unprice/services/customers"
import { LogdrainMetrics, NoopMetrics } from "@unprice/services/metrics"
import type { Metrics } from "@unprice/services/metrics"
import type { MiddlewareHandler } from "hono"
import { ApiKeysService } from "~/apikey/service"
import { EntitlementService } from "~/entitlement/service"
import type { HonoEnv } from "~/hono/env"
import { ApiProjectService } from "~/project"

import { UpstashRedisStore } from "@unkey/cache/stores"
import { SubscriptionService } from "@unprice/services/subscriptions"
import { endTime, startTime } from "hono/timing"
import { unpriceDb } from "~/util/db"

/**
 * These maps persist between worker executions and are used for caching
 */
const hashCache = new Map()

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
      service: "api",
      defaultFields: {
        isolateId: c.get("isolateId"),
        isolateCreatedAt: c.get("isolateCreatedAt"),
        requestId: c.get("requestId"),
        requestStartedAt: c.get("requestStartedAt"),
        performanceStart: c.get("performanceStart"),
        location: c.get("stats").colo,
        workspaceId: c.get("workspaceId"),
        projectId: c.get("projectId"),
        userAgent: c.get("stats").ua,
        path: c.req.path,
      },
    })

    endTime(c, "initLogger")

    // start a new timer
    startTime(c, "initMetrics")
    const emitMetrics = c.env.EMIT_METRICS_LOGS.toString() === "true"

    const metrics: Metrics = emitMetrics
      ? new LogdrainMetrics({
          requestId,
          environment: c.env.NODE_ENV,
          logger,
          service: "api",
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
      emitMetrics
    )

    // const cloudflareCacheStore =
    //   c.env.CLOUDFLARE_ZONE_ID && c.env.CLOUDFLARE_API_TOKEN
    //     ? new CloudflareStore({
    //         cloudflareApiKey: c.env.CLOUDFLARE_API_TOKEN,
    //         zoneId: c.env.CLOUDFLARE_ZONE_ID,
    //         domain: "cache.unprice.dev",
    //         cacheBuster: "v2",
    //       })
    //     : undefined

    // redis seems to be faster than cloudflare
    const upstashCacheStore =
      c.env.UPSTASH_REDIS_REST_URL && c.env.UPSTASH_REDIS_REST_TOKEN
        ? new UpstashRedisStore({
            redis: upstashRedis,
          })
        : undefined

    // register the cloudflare store if it is configured
    await cacheService.init(upstashCacheStore ? [upstashCacheStore] : [])

    const cache = cacheService.getCache()

    endTime(c, "initCache")

    // start a new timer
    startTime(c, "initDb")

    endTime(c, "initDb")

    // start a new timer
    startTime(c, "initAnalytics")

    const analytics = new Analytics({
      emit: Boolean(c.env.EMIT_ANALYTICS),
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
      db: unpriceDb,
    })

    endTime(c, "initCustomer")

    // start a new timer
    startTime(c, "initSubscription")

    const subscription = new SubscriptionService({
      logger,
      analytics,
      cache,
      db: unpriceDb,
      waitUntil: c.executionCtx.waitUntil.bind(c.executionCtx),
      metrics,
    })

    endTime(c, "initSubscription")
    // start a new timer
    startTime(c, "initEntitlement")

    const entitlement = new EntitlementService({
      namespace: c.env.usagelimit,
      projectNamespace: c.env.projectdo,
      requestId,
      logger,
      metrics,
      analytics,
      cache,
      db: unpriceDb,
      waitUntil: c.executionCtx.waitUntil.bind(c.executionCtx),
      customer,
      stats: c.get("stats"),
      hashCache,
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
      db: unpriceDb,
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
      db: unpriceDb,
      waitUntil: c.executionCtx.waitUntil.bind(c.executionCtx),
      hashCache,
    })

    endTime(c, "initApikey")

    c.set("services", {
      version: "1.0.0",
      entitlement,
      subscription,
      analytics,
      project,
      cache,
      logger,
      metrics,
      apikey,
      db: unpriceDb,
      customer,
    })

    startTime(c, "emitInitMetrics")
    // emit the init event
    metrics.emit({
      metric: "metric.init",
      duration: performance.now() - performanceStart,
    })

    endTime(c, "emitInitMetrics")

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
