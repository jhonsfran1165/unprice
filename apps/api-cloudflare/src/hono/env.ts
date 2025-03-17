import type { Database } from "@unprice/db"
import type { Logger } from "@unprice/logging"
import type { Analytics } from "@unprice/tinybird"
import type { ApiKeysService } from "~/apikey/service"
import type { Cache } from "~/cache"
import type { Env } from "~/env"
import type { Metrics } from "~/metrics"
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
    workspaceId?: string
    projectId?: string
    unpriceCustomerId?: string
    services: ServiceContext
    /**
     * IP address or region information
     */
    location: string
    userAgent?: string
  }
}
