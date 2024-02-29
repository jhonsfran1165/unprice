import { createEnv } from "@t3-oss/env-nextjs"
import * as z from "zod"

export const env = createEnv({
  server: {
    NEXTJS_URL: z.preprocess(
      (str) =>
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : str,
      process.env.VERCEL_URL ? z.string().min(1) : z.string().url()
    ),
    UPSTASH_REDIS_REST_TOKEN: z.string(),
    UPSTASH_REDIS_REST_URL: z.string().url(),
  },
  experimental__runtimeEnv: {},
  skipValidation:
    !!process.env.SKIP_ENV_VALIDATION ||
    process.env.npm_lifecycle_event === "lint",
})
