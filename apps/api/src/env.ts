import type { Tinybird } from '@chronark/zod-bird'
import { z } from 'zod'
import type { DurableObjectUsagelimiter } from './usagelimit/do'

export const zEnv = z.object({
  VERSION: z.string().default('unknown'),
  usagelimit: z.custom<DurableObjectNamespace<DurableObjectUsagelimiter>>((ns) => typeof ns === 'object'),
  analytics: z.custom<Tinybird>((tb) => typeof tb === 'object'),
  TINYBIRD_TOKEN: z.string(),
  TINYBIRD_URL: z.string(),
  CLOUDFLARE_ZONE_ID: z.string(),
  CLOUDFLARE_API_KEY: z.string(),
  UPSTASH_REDIS_REST_TOKEN: z.string(),
  UPSTASH_REDIS_REST_URL: z.string(),
  ENCRYPTION_KEY: z.string(),
  EMIT_METRICS_LOGS: z.boolean().default(false),
  ENVIRONMENT: z.enum(["development", "preview", "test", "production"]).default("development"),
})

export type Env = z.infer<typeof zEnv>
