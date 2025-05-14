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
  private context: Context
  private metrics: Metrics
  private readonly emitMetrics: boolean

  constructor(context: Context, metrics: Metrics, emitMetrics: boolean) {
    this.context = context
    this.metrics = metrics
    this.emitMetrics = emitMetrics
  }

  /**
   * Initialize the cache service
   */
  async init(): Promise<void> {
    if (this.cache) return

    // emit the cache size
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
      env.CLOUDFLARE_ZONE_ID && env.CLOUDFLARE_API_TOKEN
        ? new CloudflareStore({
            cloudflareApiKey: env.CLOUDFLARE_API_TOKEN,
            zoneId: env.CLOUDFLARE_ZONE_ID,
            domain: "cache.unprice.dev",
            cacheBuster: "v2",
          })
        : undefined

    if (cloudflare) {
      stores.push(cloudflare)
    }

    const metricsMiddleware = withMetrics(this.metrics)
    const storesWithMetrics = this.emitMetrics
      ? stores.map((s) => metricsMiddleware.wrap(s))
      : stores

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
      customerActivePhase: new Namespace<CacheNamespaces["customerActivePhase"]>(
        this.context,
        defaultOpts
      ),
      customerEntitlements: new Namespace<CacheNamespaces["customerEntitlements"]>(
        this.context,
        defaultOpts
      ),
      customerPaymentMethods: new Namespace<CacheNamespaces["customerPaymentMethods"]>(
        this.context,
        defaultOpts
      ),
      customer: new Namespace<CacheNamespaces["customer"]>(this.context, defaultOpts),
      planVersionList: new Namespace<CacheNamespaces["planVersionList"]>(this.context, defaultOpts),
      planVersion: new Namespace<CacheNamespaces["planVersion"]>(this.context, defaultOpts),
      projectFeatures: new Namespace<CacheNamespaces["projectFeatures"]>(this.context, defaultOpts),
      idempotentRequestUsageByHash: new Namespace<CacheNamespaces["idempotentRequestUsageByHash"]>(
        this.context,
        {
          ...defaultOpts,
          fresh: 1000 * 60, // 1 minute
          stale: 1000 * 60, // delete after 1 minutes
        }
      ),
      customerSubscription: new Namespace<CacheNamespaces["customerSubscription"]>(
        this.context,
        defaultOpts
      ),
    })
  }

  /**
   * Get the cache
   */
  getCache(): Cache {
    if (!this.cache) {
      throw new Error("Cache not initialized. Call init() first.")
    }
    return this.cache
  }
}
