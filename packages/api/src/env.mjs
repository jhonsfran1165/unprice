import { createEnv } from "@t3-oss/env-nextjs"
import * as z from "zod"

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "production"]).default("development"),
    NEXTJS_URL: z.preprocess(
      (str) => (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : str),
      process.env.VERCEL_URL ? z.string().min(1) : z.string().url()
    ),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    STRIPE_WEBHOOK_SECRET: z.string(),
    PROJECT_ID_VERCEL: z.string(),
    TEAM_ID_VERCEL: z.string(),
    VERCEL_AUTH_BEARER_TOKEN: z.string(),
    TINYBIRD_TOKEN: z.string(),
    BASELIME_APIKEY: z.string(),
    EMIT_METRICS_LOGS: z
      .string()
      .optional()
      .default("true")
      .transform((v) => {
        return v === "true"
      }),
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
