import { createEnv } from "@t3-oss/env-nextjs"
import * as z from "zod"

export const env = createEnv({
  shared: {
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    VERCEL_ENV: z.enum(["development", "preview", "production"]).default("development"),
    DRIZZLE_LOG: z.string().default("false"),
  },
  server: {
    DATABASE_URL: z.string().min(1).url(),
    DATABASE_READ1_URL: z.string().optional(),
    DATABASE_READ2_URL: z.string().optional(),
  },
  client: {},
  // Client side variables gets destructured here due to Next.js static analysis
  // Shared ones are also included here for good measure since the behavior has been inconsistent
  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    DRIZZLE_LOG: process.env.DRIZZLE_LOG,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION || process.env.npm_lifecycle_event === "lint",
})
