import { createEnv } from "@t3-oss/env-core"
import type { StandardSchemaV1 } from "@t3-oss/env-core"
import * as z from "zod"

export const env = createEnv({
  shared: {
    NODE_ENV: z.enum(["development", "production", "test", "preview"]).default("development"),
    VERCEL_ENV: z.enum(["development", "preview", "production"]).default("development"),
  },
  server: {
    TINYBIRD_TOKEN: z.string(),
    TINYBIRD_URL: z.string(),
    EMIT_ANALYTICS: z
      .string()
      .optional()
      .default("true")
      .transform((v) => {
        return v === "true"
      })
      .pipe(z.boolean()),
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION || process.env.npm_lifecycle_event === "lint",
  onValidationError: (issues: readonly StandardSchemaV1.Issue[]) => {
    throw new Error(`Invalid environment variables in Tinybird: ${JSON.stringify(issues, null, 2)}`)
  },
})
