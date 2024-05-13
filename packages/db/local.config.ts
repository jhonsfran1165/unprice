import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./src/local",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL_MIGRATOR_LOCAL!,
  },
  migrations: {
    table: "migrations",
  },
  tablesFilter: ["builderai_*"],
  verbose: true,
  strict: true,
})
