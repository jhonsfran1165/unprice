import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  shared: {
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    VERCEL_ENV: z.enum(["development", "preview", "production"]).default("preview"),
  },
  server: {
    VERCEL_PROJECT_UNPRICE_ID: z.string(),
    VERCEL_TEAM_ID: z.string(),
    VERCEL_TOKEN: z.string(),
    BASELIME_APIKEY: z.string(),
    ENCRYPTION_KEY: z.string(),
  },
  client: {},
  // Client side variables gets destructured here due to Next.js static analysis
  // Shared ones are also included here for good measure since the behavior has been inconsistent
  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION || process.env.npm_lifecycle_event === "lint",
})
