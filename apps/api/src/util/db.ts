import { env } from "cloudflare:workers"
import { createConnection } from "@unprice/db"
import type { Env } from "~/env"

export const unpriceDb = createConnection({
  env: env.NODE_ENV as Env["NODE_ENV"],
  primaryDatabaseUrl: env.DATABASE_URL,
  read1DatabaseUrl: env.DATABASE_READ1_URL,
  read2DatabaseUrl: env.DATABASE_READ2_URL,
  logger: env.DRIZZLE_LOG.toString() === "true",
})
