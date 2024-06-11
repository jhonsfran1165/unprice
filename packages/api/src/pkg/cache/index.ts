import { type Cache as C, type Context, Namespace, createCache, withMetrics } from "@unkey/cache"
import { MemoryStore, type Store } from "@unkey/cache"

import { env } from "../../env.mjs"
import type { Metrics } from "../metrics"
import type { CacheNamespace, CacheNamespaces } from "./namespaces"
import { CACHE_FRESHNESS_TIME_MS, CACHE_STALENESS_TIME_MS } from "./stale-while-revalidate"
import { UpstashStore } from "./stores/upstash"

const persistentMap = new Map()

export function initCache(c: Context, metrics: Metrics): C<CacheNamespaces> {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const stores: Array<Store<CacheNamespace, any>> = []

  const memory = new MemoryStore<CacheNamespace, CacheNamespaces[CacheNamespace]>({
    persistentMap,
  })

  stores.push(memory)

  const upstash: Store<CacheNamespace, CacheNamespaces[CacheNamespace]> | undefined =
    env.UPSTASH_REDIS_REST_TOKEN && env.UPSTASH_REDIS_REST_URL
      ? new UpstashStore({
          token: env.UPSTASH_REDIS_REST_TOKEN,
          url: env.UPSTASH_REDIS_REST_URL,
        })
      : undefined

  if (upstash) {
    stores.push(upstash)
  }

  // TODO: add metrics
  const metricsMiddleware = withMetrics(metrics)
  const storesWithMetrics = stores.map((s) => metricsMiddleware(s))

  const defaultOpts = {
    stores: storesWithMetrics,
    fresh: CACHE_FRESHNESS_TIME_MS,
    stale: CACHE_STALENESS_TIME_MS,
  }

  return createCache({
    featureByCustomerId: new Namespace<CacheNamespaces["featureByCustomerId"]>(c, defaultOpts),
    entitlementsByCustomerId: new Namespace<CacheNamespaces["entitlementsByCustomerId"]>(
      c,
      defaultOpts
    ),
    idempotentRequestUsageByHash: new Namespace<CacheNamespaces["idempotentRequestUsageByHash"]>(
      c,
      {
        ...defaultOpts,
        stale: 60 * 1000, // 1 minute
      }
    ),
    subscriptionsByCustomerId: new Namespace<CacheNamespaces["subscriptionsByCustomerId"]>(
      c,
      defaultOpts
    ),
  })
}

export type Cache = C<CacheNamespaces>
