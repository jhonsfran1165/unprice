import { createEnv } from "@t3-oss/env-core"
import { env as envDb } from "@unprice/db/env"
import { env as envLogging } from "@unprice/logging/env"
import { env as envServices } from "@unprice/services/env"
import { env as envAnalytics } from "@unprice/tinybird/env"
import { z } from "zod"
import type { DurableObjectUsagelimiter } from "~/entitlement/do"

export const env = createEnv({
  shared: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  },
  server: {
    AUTH_SECRET: z.string(),
    VERSION: z.string().default("unknown"),
    usagelimit: z.custom<DurableObjectNamespace<DurableObjectUsagelimiter>>(
      (ns) => typeof ns === "object"
    ),
    // RL_10_60s: cloudflareRatelimiter,
  },
  emptyStringAsUndefined: true,
  runtimeEnv: process.env,
  extends: [envServices, envDb, envAnalytics, envLogging],
  skipValidation: !!process.env.SKIP_ENV_VALIDATION || process.env.npm_lifecycle_event === "lint",
})

export const cloudflareRatelimiter = z.custom<{
  limit: (opts: { key: string }) => Promise<{ success: boolean }>
}>((r) => !!r && typeof r.limit === "function")

export type Env = typeof env
