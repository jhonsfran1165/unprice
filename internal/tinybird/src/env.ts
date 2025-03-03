import { createEnv } from "@t3-oss/env-nextjs"
import * as z from "zod"

export const env = createEnv({
  shared: {},
  server: {
    TINYBIRD_TOKEN: z.string(),
    TINYBIRD_URL: z.string(),
  },
  // Client side variables gets destructured here due to Next.js static analysis
  // Shared ones are also included here for good measure since the behavior has been inconsistent
  experimental__runtimeEnv: {
    TINYBIRD_TOKEN: process.env.TINYBIRD_TOKEN,
    TINYBIRD_URL: process.env.TINYBIRD_URL,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION || process.env.npm_lifecycle_event === "lint",
})
