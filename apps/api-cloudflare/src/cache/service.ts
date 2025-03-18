import { type Cache as C, Namespace, createCache } from "@unkey/cache"
import { withMetrics } from "@unkey/cache/middleware"
import { CloudflareStore, MemoryStore, type Store } from "@unkey/cache/stores"

import type { Context } from "hono"
import type { HonoEnv } from "~/hono/env"
import type { Metrics } from "~/metrics"
import type { CacheNamespace, CacheNamespaces } from "./namespaces"
import { CACHE_FRESHNESS_TIME_MS, CACHE_STALENESS_TIME_MS } from "./stale-while-revalidate"

const persistentMap = new Map()

export function initCache(c: Context<HonoEnv>, metrics: Metrics): C<CacheNamespaces> {
  metrics.emit({
    metric: "metric.cache.size",
    tier: "memory",
    size: persistentMap.size,
    name: "cache",
  })

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const stores: Array<Store<CacheNamespace, any>> = []

  const memory = new MemoryStore<CacheNamespace, CacheNamespaces[CacheNamespace]>({
    persistentMap,
    unstableEvictOnSet: {
      frequency: 0.1,
      maxItems: 5000,
    },
  })

  stores.push(memory)

  const cloudflare: Store<CacheNamespace, CacheNamespaces[CacheNamespace]> | undefined =
    c.env.CLOUDFLARE_ZONE_ID && c.env.CLOUDFLARE_API_KEY
      ? new CloudflareStore({
          cloudflareApiKey: c.env.CLOUDFLARE_API_KEY,
          zoneId: c.env.CLOUDFLARE_ZONE_ID,
          domain: "cache.unprice.dev",
          cacheBuster: "v1",
        })
      : undefined

  if (cloudflare) {
    stores.push(cloudflare)
  }

  const metricsMiddleware = withMetrics(metrics)

  const storesWithMetrics = stores.map((s) => metricsMiddleware.wrap(s))

  const defaultOpts = {
    stores: storesWithMetrics,
    fresh: CACHE_FRESHNESS_TIME_MS,
    stale: CACHE_STALENESS_TIME_MS,
  }

  return createCache({
    apiKeyByHash: new Namespace<CacheNamespaces["apiKeyByHash"]>(c.executionCtx, defaultOpts),
    featureByCustomerId: new Namespace<CacheNamespaces["featureByCustomerId"]>(
      c.executionCtx,
      defaultOpts
    ),
    entitlementsByCustomerId: new Namespace<CacheNamespaces["entitlementsByCustomerId"]>(
      c.executionCtx,
      defaultOpts
    ),
  })
}

export type Cache = C<CacheNamespaces>
