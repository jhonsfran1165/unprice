import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./src/migrations/custom",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL_MIGRATOR!,
  },
  migrations: {
    table: "migrations",
    schema: "drizzle",
  },
  introspect: {
    casing: "preserve",
  },
  tablesFilter: ["builderai_*"],
  verbose: true,
  strict: true,
})
