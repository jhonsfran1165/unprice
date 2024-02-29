import type { Config } from "drizzle-kit"

import { env } from "./env.mjs"

export default {
  schema: "./src/schema.ts",
  out: "./src/neon",
  driver: "pg",
  dbCredentials: {
    connectionString: env.DATABASE_URL_MIGRATOR!,
  },
  // verbose: true,
  strict: true,
} satisfies Config
