import type { ApiKeyExtended } from "@unprice/db/validators"

export type CacheNamespaces = {
  apiKeyByHash: ApiKeyExtended | null
}

export type CacheNamespace = keyof CacheNamespaces
