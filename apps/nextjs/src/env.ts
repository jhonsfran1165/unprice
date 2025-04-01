import { createEnv } from "@t3-oss/env-core"
import { env as authEnv } from "@unprice/auth/env"
import { env as stripeEnv } from "@unprice/stripe/env"
import { env as trpcEnv } from "@unprice/trpc/env"
import { z } from "zod"

export const env = createEnv({
  shared: {
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    VERCEL_ENV: z.enum(["development", "preview", "production"]).default("development"),
  },
  server: {
    VERCEL_PROJECT_UNPRICE_ID: z.string(),
    VERCEL_TEAM_ID: z.string(),
    VERCEL_TOKEN: z.string(),
    BASELIME_APIKEY: z.string(),
    ENCRYPTION_KEY: z.string(),
    COOKIE_ENCRYPTION_KEY: z.string(),
  },
  runtimeEnv: process.env,
  clientPrefix: "NEXT_PUBLIC_",
  client: {},
  skipValidation: !!process.env.SKIP_ENV_VALIDATION || process.env.npm_lifecycle_event === "lint",
  extends: [authEnv, stripeEnv, trpcEnv],
})
