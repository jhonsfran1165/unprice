import { createEnv } from "@t3-oss/env-core"
import * as z from "zod"

export const env = createEnv({
  shared: {
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    VERCEL_ENV: z.enum(["development", "preview", "production"]).default("development"),
  },
  server: {},
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION || process.env.npm_lifecycle_event === "lint",
})
