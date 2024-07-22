import { defineConfig } from "drizzle-kit"
import { projectPrefixBD } from "./src/utils"

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./src/migrations/local",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL_MIGRATOR_LOCAL!,
  },
  migrations: {
    table: "migrations",
    schema: "drizzle",
  },
  introspect: {
    casing: "preserve",
  },
  tablesFilter: [`${projectPrefixBD}_*`],
  verbose: true,
  strict: true,
})
