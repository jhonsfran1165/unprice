import type { Database } from "@unprice/db"
import type { Logger } from "@unprice/logging"
import type { Cache } from "@unprice/services/cache"
import type { Metrics } from "@unprice/services/metrics"
import type { Analytics } from "@unprice/tinybird"
import type { ApiKeysService } from "~/apikey/service"
import type { Env } from "~/env"
import type { UsageLimiter } from "~/usagelimit"

export type ServiceContext = {
  version: string
  usagelimit: UsageLimiter
  analytics: Analytics
  cache: Cache
  logger: Logger
  metrics: Metrics
  apikey: ApiKeysService
  db: Database
}

export type HonoEnv = {
  Bindings: Env
  Variables: {
    isolateId: string
    isolateCreatedAt: number
    requestId: string
    requestStartedAt: number
    performanceStart: number
    workspaceId?: string
    projectId?: string
    services: ServiceContext
    /**
     * IP address or region information
     */
    location: string
    userAgent?: string
  }
}
