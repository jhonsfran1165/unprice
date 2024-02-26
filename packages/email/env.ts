import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const env = createEnv({
  server: {
    RESEND_API_KEY: z.string().min(1),
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.CI || !!process.env.SKIP_ENV_VALIDATION,
})
