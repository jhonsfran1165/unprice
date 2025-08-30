import { createConnection } from "@unprice/db"
import { env } from "../env"

export const db = createConnection({
  env: env.NODE_ENV,
  primaryDatabaseUrl: env.DATABASE_URL,
  read1DatabaseUrl: env.DATABASE_READ1_URL,
  read2DatabaseUrl: env.DATABASE_READ2_URL,
  logger: env.DRIZZLE_LOG && env.DRIZZLE_LOG.toString() === "true",
  singleton: true,
})
