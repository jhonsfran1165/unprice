import { type Cache as C, type Context, Namespace, createCache } from "@unkey/cache"
import { withMetrics } from "@unkey/cache/middleware"

import { CloudflareStore, MemoryStore, type Store } from "@unkey/cache/stores"

import { env } from "../../env"
import type { Metrics } from "../metrics"
import type { CacheNamespace, CacheNamespaces } from "./namespaces"
import { CACHE_FRESHNESS_TIME_MS, CACHE_STALENESS_TIME_MS } from "./stale-while-revalidate"

const persistentMap = new Map()

export type Cache = C<CacheNamespaces>

export class CacheService {
  private cache: Cache | null = null
  private readonly context: Context
  private readonly metrics: Metrics

  constructor(context: Context, metrics: Metrics) {
    this.context = context
    this.metrics = metrics
  }

  async init(): Promise<void> {
    if (this.cache) return

    this.metrics.emit({
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
      env.CLOUDFLARE_ZONE_ID && env.CLOUDFLARE_API_KEY
        ? new CloudflareStore({
            cloudflareApiKey: env.CLOUDFLARE_API_KEY,
            zoneId: env.CLOUDFLARE_ZONE_ID,
            domain: "cache.unprice.dev",
            cacheBuster: "v1",
          })
        : undefined

    if (cloudflare) {
      stores.push(cloudflare)
    }

    const metricsMiddleware = withMetrics(this.metrics)

    const storesWithMetrics = stores.map((s) => metricsMiddleware.wrap(s))

    const defaultOpts = {
      stores: storesWithMetrics,
      fresh: CACHE_FRESHNESS_TIME_MS,
      stale: CACHE_STALENESS_TIME_MS,
    }

    this.cache = createCache({
      apiKeyByHash: new Namespace<CacheNamespaces["apiKeyByHash"]>(this.context, defaultOpts),
      customerEntitlement: new Namespace<CacheNamespaces["customerEntitlement"]>(
        this.context,
        defaultOpts
      ),
      customerEntitlements: new Namespace<CacheNamespaces["customerEntitlements"]>(
        this.context,
        defaultOpts
      ),
      idempotentRequestUsageByHash: new Namespace<CacheNamespaces["idempotentRequestUsageByHash"]>(
        this.context,
        {
          ...defaultOpts,
          fresh: 1000 * 60, // 1 minute
          stale: 1000 * 60, // delete after 1 minutes
        }
      ),
      customerSubscription: new Namespace<CacheNamespaces["customerSubscription"]>(this.context, {
        ...defaultOpts,
        // update the cache every 1 day
        fresh: 1000 * 60 * 60 * 24, // 1 day
        // cache the entitlements for 30 days with revalidation in the background every 1 day
        stale: 1000 * 60 * 60 * 24 * 30, // 30 days
      }),
    })
  }

  getCache(): Cache {
    if (!this.cache) {
      throw new Error("Cache not initialized. Call init() first.")
    }
    return this.cache
  }
}
