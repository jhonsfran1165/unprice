import { createEnv } from "@t3-oss/env-core"
import * as z from "zod"

export const env = createEnv({
  shared: {},
  server: {
    TINYBIRD_TOKEN: z.string(),
    TINYBIRD_URL: z.string(),
    EMIT_ANALYTICS: z
      .string()
      .optional()
      .default("true")
      .transform((v) => {
        return v === "true"
      }),
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION || process.env.npm_lifecycle_event === "lint",
})
