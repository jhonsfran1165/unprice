import { newId } from "@unprice/id"
import { ConsoleLogger } from "@unprice/logging"
import { Analytics } from "@unprice/tinybird"
import type { MiddlewareHandler } from "hono"
import { ApiKeysService } from "~/apikey/service"
import { initCache } from "~/cache/service"
import type { HonoEnv } from "~/hono/env"
import type { Metrics } from "~/metrics"
import { LogdrainMetrics } from "~/metrics/logdrain"
import { NoopMetrics } from "~/metrics/noop"
import { DurableUsageLimiter } from "~/usagelimit"
import { createDb } from "~/util/db"

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

    const db = createDb({
      env: c.env.ENV,
      primaryDatabaseUrl: c.env.DATABASE_URL,
      read1DatabaseUrl: c.env.DATABASE_READ1_URL,
      read2DatabaseUrl: c.env.DATABASE_READ2_URL,
      logger: false,
    })

    const logger = new ConsoleLogger({
      requestId,
      application: "api",
      environment: c.env.ENV,
    })

    const metrics: Metrics = c.env.EMIT_METRICS_LOGS
      ? new LogdrainMetrics({
          requestId,
          environment: c.env.ENV,
          isolateId,
          logger,
          application: "api",
        })
      : new NoopMetrics()

    const cache = initCache(c, metrics)

    const analytics = new Analytics({
      emit: c.env.EMIT_METRICS_LOGS,
      tinybirdToken: c.env.TINYBIRD_TOKEN,
      tinybirdUrl: c.env.TINYBIRD_URL,
    })

    const usagelimit = new DurableUsageLimiter({
      namespace: c.env.usagelimit,
      requestId,
      logger,
      metrics,
      analytics,
      cache,
      db,
      waitUntil: c.executionCtx.waitUntil.bind(c.executionCtx),
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
      usagelimit,
      analytics,
      cache,
      logger,
      metrics,
      apikey,
      db,
    })

    await next()
  }
}
