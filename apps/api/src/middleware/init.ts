import { Tinybird } from "@chronark/zod-bird";
import { newId } from "@unprice/id";
import type { MiddlewareHandler } from "hono";
import type { HonoEnv } from "../hono/env";
import { DurableUsageLimiter } from "../usagelimit";

/**
 * These maps persist between worker executions and are used for caching
 */
const rlMap = new Map();

/**
 * workerId and isolateCreatedAt are used to track the lifetime of the worker
 * and are set once when the worker is first initialized.
 *
 * subsequent requests will use the same workerId and isolateCreatedAt
 */
let isolateId: string | undefined = undefined;
let isolateCreatedAt: number | undefined = undefined;

/**
 * Initialize all services.
 *
 * Call this once before any hono handlers run.
 */
export function init(): MiddlewareHandler<HonoEnv> {
  return async (c, next) => {
    if (!isolateId) {
      isolateId = crypto.randomUUID();
    }
    if (!isolateCreatedAt) {
      isolateCreatedAt = Date.now();
    }
    c.set("isolateId", isolateId);
    c.set("isolateCreatedAt", isolateCreatedAt);

    const requestId = newId("request");
    c.set("requestId", requestId);

    c.set("requestStartedAt", Date.now());

    c.res.headers.set("unprice-request-id", requestId);


    c.set("services", {
      version: "1.0.0",
      usagelimit: new DurableUsageLimiter({
        namespace: c.env.usagelimit,
        requestId,
      }),
      analytics: new Tinybird({
        token: c.env.TINYBIRD_TOKEN,
        baseUrl: c.env.TINYBIRD_URL,
      })
      ,
    });

    await next();
  };
}
