import { CacheService } from "@unprice/api/services/cache"
import { NoopMetrics } from "@unprice/api/services/metrics"
import { ConsoleLogger } from "@unprice/logging"
import { Analytics } from "@unprice/tinybird"
import { db } from "../../db"
import { env } from "../../env.mjs"

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
  const cache = new CacheService(
    {
      waitUntil: () => {},
    },
    new NoopMetrics()
  )

  await cache.init()

  const tinybird = new Analytics({
    emit: true,
    tinybirdToken: env.TINYBIRD_TOKEN,
    tinybirdUrl: env.TINYBIRD_URL,
  })

  const logger = new ConsoleLogger({
    requestId: taskId,
    environment: env.NODE_ENV,
    application: "jobs",
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
