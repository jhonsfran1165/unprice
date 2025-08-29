import { type Cache as C, type Context, Namespace, createCache } from "@unkey/cache"
import { withMetrics } from "@unkey/cache/middleware"

import { MemoryStore, type Store } from "@unkey/cache/stores"
import type { Metrics } from "../metrics"
import type { CacheNamespace, CacheNamespaces } from "./namespaces"
import {
  CACHE_ANALYTICS_FRESHNESS_TIME_MS,
  CACHE_ANALYTICS_STALENESS_TIME_MS,
  CACHE_FRESHNESS_TIME_MS,
  CACHE_STALENESS_TIME_MS,
} from "./stale-while-revalidate"

// because this is instantiated as global, the map persist in memory for different requests
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
   * @param extraStores - Extra stores to add to the cache
   */
  init(extraStores: Store<CacheNamespace, CacheNamespaces[CacheNamespace]>[]): void {
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

    // push the memory first to hit it first
    stores.push(memory)

    // push the extra stores
    stores.push(...extraStores)

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
          stale: 1000 * 60, // revalidate after 1 minutes
        }
      ),
      customerSubscription: new Namespace<CacheNamespaces["customerSubscription"]>(
        this.context,
        defaultOpts
      ),
      pageCountryVisits: new Namespace<CacheNamespaces["pageCountryVisits"]>(this.context, {
        ...defaultOpts,
        fresh: CACHE_ANALYTICS_FRESHNESS_TIME_MS, // 30 seconds
        stale: CACHE_ANALYTICS_STALENESS_TIME_MS, // revalidate 1 hour
      }),
      pageBrowserVisits: new Namespace<CacheNamespaces["pageBrowserVisits"]>(this.context, {
        ...defaultOpts,
        fresh: CACHE_ANALYTICS_FRESHNESS_TIME_MS, // 30 seconds
        stale: CACHE_ANALYTICS_STALENESS_TIME_MS, // revalidate 1 hour
      }),
      getPagesOverview: new Namespace<CacheNamespaces["getPagesOverview"]>(this.context, {
        ...defaultOpts,
        fresh: CACHE_ANALYTICS_FRESHNESS_TIME_MS, // 30 seconds
        stale: CACHE_ANALYTICS_STALENESS_TIME_MS, // revalidate 1 hour
      }),
      getFeatureHeatmap: new Namespace<CacheNamespaces["getFeatureHeatmap"]>(this.context, {
        ...defaultOpts,
        fresh: CACHE_ANALYTICS_FRESHNESS_TIME_MS, // 30 seconds
        stale: CACHE_ANALYTICS_STALENESS_TIME_MS, // revalidate 1 hour
      }),
      getFeaturesOverview: new Namespace<CacheNamespaces["getFeaturesOverview"]>(this.context, {
        ...defaultOpts,
        fresh: CACHE_ANALYTICS_FRESHNESS_TIME_MS, // 30 seconds
        stale: CACHE_ANALYTICS_STALENESS_TIME_MS, // revalidate 1 hour
      }),
      getPlansStats: new Namespace<CacheNamespaces["getPlansStats"]>(this.context, {
        ...defaultOpts,
        fresh: CACHE_ANALYTICS_FRESHNESS_TIME_MS, // 30 seconds
        stale: CACHE_ANALYTICS_STALENESS_TIME_MS, // revalidate 1 hour
      }),
      getPlansConversion: new Namespace<CacheNamespaces["getPlansConversion"]>(this.context, {
        ...defaultOpts,
        fresh: CACHE_ANALYTICS_FRESHNESS_TIME_MS, // 30 seconds
        stale: CACHE_ANALYTICS_STALENESS_TIME_MS, // revalidate 1 hour
      }),
      getOverviewStats: new Namespace<CacheNamespaces["getOverviewStats"]>(this.context, {
        ...defaultOpts,
        fresh: CACHE_ANALYTICS_FRESHNESS_TIME_MS, // 30 seconds
        stale: CACHE_ANALYTICS_STALENESS_TIME_MS, // revalidate 1 hour
      }),
      getUsage: new Namespace<CacheNamespaces["getUsage"]>(this.context, {
        ...defaultOpts,
        fresh: CACHE_ANALYTICS_FRESHNESS_TIME_MS, // 30 seconds
        stale: CACHE_ANALYTICS_STALENESS_TIME_MS, // revalidate 1 hour
      }),
      getVerifications: new Namespace<CacheNamespaces["getVerifications"]>(this.context, {
        ...defaultOpts,
        fresh: CACHE_ANALYTICS_FRESHNESS_TIME_MS, // 30 seconds
        stale: CACHE_ANALYTICS_STALENESS_TIME_MS, // revalidate 1 hour
      }),
      getVerificationRegions: new Namespace<CacheNamespaces["getVerificationRegions"]>(
        this.context,
        {
          ...defaultOpts,
          fresh: CACHE_ANALYTICS_FRESHNESS_TIME_MS, // 30 seconds
          stale: CACHE_ANALYTICS_STALENESS_TIME_MS, // revalidate 1 hour
        }
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
