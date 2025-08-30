import { Analytics } from "@unprice/analytics"
import { ConsoleLogger } from "@unprice/logging"
import { CacheService } from "@unprice/services/cache"
import { NoopMetrics } from "@unprice/services/metrics"
import { env } from "../../env"
import { db } from "../db"

export const createContext = async ({
  taskId,
  subscriptionId,
  projectId,
  phaseId,
  defaultFields,
}: {
  taskId: string
  subscriptionId: string
  projectId: string
  phaseId: string
  defaultFields: Record<string, string> & {
    api: string
  }
}) => {
  // don't register any stores - only memory
  const cache = new CacheService(
    {
      waitUntil: () => {},
    },
    new NoopMetrics(),
    false
  )

  cache.init([])

  const tinybird = new Analytics({
    emit: true,
    tinybirdToken: env.TINYBIRD_TOKEN,
    tinybirdUrl: env.TINYBIRD_URL,
  })

  const logger = new ConsoleLogger({
    requestId: taskId,
    environment: env.NODE_ENV,
    service: "jobs",
    defaultFields: {
      ...defaultFields,
      subscriptionId,
      projectId,
      api: "jobs.subscription.cancel",
      phaseId,
      requestId: taskId,
    },
  })

  return {
    waitUntil: () => {},
    headers: new Headers(),
    session: null,
    activeWorkspaceSlug: "",
    activeProjectSlug: "",
    ip: "background-jobs",
    requestId: taskId,
    logger: logger,
    metrics: new NoopMetrics(),
    cache: cache.getCache(),
    db: db,
    analytics: tinybird,
  }
}
