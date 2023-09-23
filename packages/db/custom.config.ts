import type { Config } from "drizzle-kit"

export default {
  schema: "./src/schema/index.ts",
  out: "./src/custom",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL_MIGRATOR ?? "",
  },
  // verbose: true,
  strict: true,
} satisfies Config
