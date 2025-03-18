import { z } from "zod"
import type { DurableObjectUsagelimiter } from "~/usagelimit/do"

export const cloudflareRatelimiter = z.custom<{
  limit: (opts: { key: string }) => Promise<{ success: boolean }>
}>((r) => !!r && typeof r.limit === "function")

export const zEnv = z.object({
  VERSION: z.string().default("unknown"),
  usagelimit: z.custom<DurableObjectNamespace<DurableObjectUsagelimiter>>(
    (ns) => typeof ns === "object"
  ),
  TINYBIRD_TOKEN: z.string(),
  TINYBIRD_URL: z.string(),
  DATABASE_URL: z.string().min(1).url(),
  DATABASE_READ1_URL: z.string().optional(),
  DATABASE_READ2_URL: z.string().optional(),
  CLOUDFLARE_ZONE_ID: z.string().optional(),
  CLOUDFLARE_API_KEY: z.string().optional(),
  AUTH_SECRET: z.string(),
  EMIT_METRICS_LOGS: z
    .string()
    .optional()
    .default("true")
    .transform((v) => {
      return v === "true"
    }),
  ENV: z.enum(["development", "test", "production"]).default("development"),
  // RL_10_60s: cloudflareRatelimiter,
})

export type Env = z.infer<typeof zEnv>
