import type { Config } from "drizzle-kit"

export default {
  schema: "./src/schema.ts",
  out: "./src/local",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL_MIGRATOR_LOCAL!,
  },
  // verbose: true,
  strict: true,
} satisfies Config
