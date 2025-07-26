import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    RESEND_API_KEY: z.string().min(1),
    NODE_ENV: z.enum(["development", "production"]),
  },
  client: {},
  skipValidation: !!process.env.SKIP_ENV_VALIDATION || process.env.npm_lifecycle_event === "lint",
  experimental__runtimeEnv: {},
})
