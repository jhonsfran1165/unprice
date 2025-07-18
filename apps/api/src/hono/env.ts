import type { Database } from "@unprice/db"
import type { Logger } from "@unprice/logging"
import type { Cache } from "@unprice/services/cache"
import type { CustomerService } from "@unprice/services/customers"
import type { Metrics } from "@unprice/services/metrics"
import type { SubscriptionService } from "@unprice/services/subscriptions"
import type { Analytics } from "@unprice/tinybird"
import type { ApiKeysService } from "~/apikey/service"
import type { EntitlementService } from "~/entitlement"
import type { Env } from "~/env"
import type { ApiProjectService } from "~/project"
import type { Analytics as AnalyticsType } from "~/util/analytics"

export type ServiceContext = {
  version: string
  entitlement: EntitlementService
  analytics: Analytics
  cache: Cache
  logger: Logger
  metrics: Metrics
  apikey: ApiKeysService
  project: ApiProjectService
  customer: CustomerService
  subscription: SubscriptionService
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
    unPriceCustomerId?: string
    workspaceId?: string
    projectId?: string
    services: ServiceContext
    analytics: AnalyticsType
  }
}
