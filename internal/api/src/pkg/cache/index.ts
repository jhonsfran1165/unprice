import { type Cache as C, type Context, Namespace, createCache } from "@unkey/cache"
import { withEncryption, withMetrics } from "@unkey/cache/middleware"
import { MemoryStore, type Store, UpstashRedisStore } from "@unkey/cache/stores"

import { env } from "../../env.mjs"
import { redis } from "../../utils/upstash"
import type { Metrics } from "../metrics"
import type { CacheNamespace, CacheNamespaces } from "./namespaces"
import { CACHE_FRESHNESS_TIME_MS, CACHE_STALENESS_TIME_MS } from "./stale-while-revalidate"

const persistentMap = new Map()

export async function initCache(c: Context, metrics: Metrics): Promise<C<CacheNamespaces>> {
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

  const metricsMiddleware = withMetrics(metrics)
  const encryptionMiddleware = await withEncryption(env.CACHE_ENCRYPTION_KEY)

  // add metrics middleware
  const upstashStoreWithMetrics = upstash ? metricsMiddleware.wrap(upstash) : undefined
  const memoryStoreWithMetrics = metricsMiddleware.wrap(memory)

  const defaultOpts = {
    stores: [memoryStoreWithMetrics, ...(upstashStoreWithMetrics ? [upstashStoreWithMetrics] : [])],
    fresh: CACHE_FRESHNESS_TIME_MS,
    stale: CACHE_STALENESS_TIME_MS,
  }

  return createCache({
    apiKeyByHash: new Namespace<CacheNamespaces["apiKeyByHash"]>(c, {
      ...defaultOpts,
      // add encryption middleware for upstash only for this namespace
      stores: [
        ...(upstashStoreWithMetrics ? [encryptionMiddleware.wrap(upstashStoreWithMetrics)] : []),
        memoryStoreWithMetrics,
      ],
    }),
    featureByCustomerId: new Namespace<CacheNamespaces["featureByCustomerId"]>(c, defaultOpts),
    entitlementsByCustomerId: new Namespace<CacheNamespaces["entitlementsByCustomerId"]>(
      c,
      defaultOpts
    ),
    idempotentRequestUsageByHash: new Namespace<CacheNamespaces["idempotentRequestUsageByHash"]>(
      c,
      {
        ...defaultOpts,
        stale: 60 * 1000, // 1 minute short live hash idempotent request usage
      }
    ),
    subscriptionsByCustomerId: new Namespace<CacheNamespaces["subscriptionsByCustomerId"]>(
      c,
      defaultOpts
    ),
  })
}

export type Cache = C<CacheNamespaces>
