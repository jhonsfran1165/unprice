import { createEnv } from "@t3-oss/env-core"
import * as z from "zod"

export const env = createEnv({
  shared: {
    NODE_ENV: z.enum(["development", "production", "test", "preview"]).default("development"),
    VERCEL_ENV: z.enum(["development", "preview", "production"]).default("development"),
  },
  server: {
    AXIOM_API_TOKEN: z.string(),
    AXIOM_DATASET: z.string(),
    // transform the string to a boolean
    EMIT_METRICS_LOGS: z
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
  onValidationError: (issues) => {
    throw new Error(`Invalid environment variables in Logging: ${JSON.stringify(issues, null, 2)}`)
  },
})
