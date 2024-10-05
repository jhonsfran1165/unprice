import { type Cache as C, type Context, Namespace, createCache } from "@unkey/cache"
import { withEncryption, withMetrics } from "@unkey/cache/middleware"
import { MemoryStore, type Store, UpstashRedisStore } from "@unkey/cache/stores"

import { env } from "../env.mjs"
import type { Metrics } from "../metrics"
import type { CacheNamespace, CacheNamespaces } from "./namespaces"
import { CACHE_FRESHNESS_TIME_MS, CACHE_STALENESS_TIME_MS } from "./stale-while-revalidate"
import { redis } from "./upstash"

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

    // in memory cache
    const memory = new MemoryStore<CacheNamespace, CacheNamespaces[CacheNamespace]>({
      persistentMap,
      unstableEvictOnSet: {
        frequency: 0.1,
        maxItems: 5000,
      },
    })

    // redis cache
    const upstash: Store<CacheNamespace, CacheNamespaces[CacheNamespace]> | undefined =
      env.UPSTASH_REDIS_REST_TOKEN && env.UPSTASH_REDIS_REST_URL
        ? new UpstashRedisStore({
            redis: redis,
          })
        : undefined

    const metricsMiddleware = withMetrics(this.metrics)
    const encryptionMiddleware = await withEncryption(env.CACHE_ENCRYPTION_KEY)

    // add metrics middleware
    const upstashStoreWithMetrics = upstash ? metricsMiddleware.wrap(upstash) : undefined
    const memoryStoreWithMetrics = metricsMiddleware.wrap(memory)

    const defaultOpts = {
      stores: [
        memoryStoreWithMetrics,
        ...(upstashStoreWithMetrics ? [upstashStoreWithMetrics] : []),
      ],
      fresh: CACHE_FRESHNESS_TIME_MS,
      stale: CACHE_STALENESS_TIME_MS,
    }

    this.cache = createCache({
      apiKeyByHash: new Namespace<CacheNamespaces["apiKeyByHash"]>(this.context, {
        ...defaultOpts,
        // add encryption middleware for upstash only for this namespace
        stores: [
          ...(upstashStoreWithMetrics ? [encryptionMiddleware.wrap(upstashStoreWithMetrics)] : []),
          memoryStoreWithMetrics,
        ],
      }),
      featureByCustomerId: new Namespace<CacheNamespaces["featureByCustomerId"]>(
        this.context,
        defaultOpts
      ),
      entitlementsByCustomerId: new Namespace<CacheNamespaces["entitlementsByCustomerId"]>(
        this.context,
        defaultOpts
      ),
      idempotentRequestUsageByHash: new Namespace<CacheNamespaces["idempotentRequestUsageByHash"]>(
        this.context,
        {
          ...defaultOpts,
          stale: 60 * 1000, // 1 minute short live hash idempotent request usage
        }
      ),
      subscriptionsByCustomerId: new Namespace<CacheNamespaces["subscriptionsByCustomerId"]>(
        this.context,
        defaultOpts
      ),
    })
  }

  getCache(): Cache {
    if (!this.cache) {
      throw new Error("Cache not initialized. Call init() first.")
    }
    return this.cache
  }
}
