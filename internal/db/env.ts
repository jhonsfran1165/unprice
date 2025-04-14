import { type StandardSchemaV1, createEnv } from "@t3-oss/env-core"
import * as z from "zod"

export const env = createEnv({
  shared: {
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    VERCEL_ENV: z.enum(["development", "preview", "production"]).default("development"),
  },
  server: {
    DRIZZLE_LOG: z
      .string()
      .optional()
      .default("false")
      .transform((v) => {
        return v === "true"
      }),
    DATABASE_URL: z.string().min(1).url(),
    DATABASE_READ1_URL: z.string().optional(),
    DATABASE_READ2_URL: z.string().optional(),
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION || process.env.npm_lifecycle_event === "lint",
  onValidationError: (issues: readonly StandardSchemaV1.Issue[]) => {
    throw new Error(`Invalid environment variables in DB: ${JSON.stringify(issues, null, 2)}`)
  },
})
