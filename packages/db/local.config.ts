import type { Config } from "drizzle-kit"

import { env } from "./env.mjs"

export default {
  schema: "./src/schema.ts",
  out: "./src/local",
  driver: "pg",
  dbCredentials: {
    connectionString: env.DATABASE_URL_MIGRATOR_LOCAL!,
  },
  // verbose: true,
  strict: true,
} satisfies Config
