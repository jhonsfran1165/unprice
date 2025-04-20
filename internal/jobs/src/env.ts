import { createEnv } from "@t3-oss/env-core"
import { env as dbEnv } from "@unprice/db/env"
import { env as loggingEnv } from "@unprice/logging/env"
import { env as servicesEnv } from "@unprice/services/env"
import { env as analyticsEnv } from "@unprice/tinybird/env"
import * as z from "zod"

export const env = createEnv({
  shared: {
    NODE_ENV: z.enum(["development", "production", "test", "preview"]).default("development"),
    VERCEL_ENV: z.enum(["development", "preview", "production"]).default("development"),
  },
  server: {
    TRIGGER_SECRET_KEY: z.string(),
    ENCRYPTION_KEY: z.string(),
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION || process.env.npm_lifecycle_event === "lint",
  extends: [dbEnv, loggingEnv, analyticsEnv, servicesEnv],
  onValidationError: (issues) => {
    throw new Error(`Invalid environment variables in Env: ${JSON.stringify(issues, null, 2)}`)
  },
})
