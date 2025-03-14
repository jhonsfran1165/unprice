import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  shared: {
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    VERCEL_ENV: z.enum(["development", "preview", "production"]).default("development"),
  },
  server: {},
  client: {
    NEXT_PUBLIC_APP_DOMAIN: z.string().optional().default("localhost:3000"),
    NEXT_PUBLIC_VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
  },
  // Client side variables gets destructured here due to Next.js static analysis
  // Shared ones are also included here for good measure since the behavior has been inconsistent
  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_DOMAIN: process.env.NEXT_PUBLIC_APP_DOMAIN,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION || process.env.npm_lifecycle_event === "lint",
})
