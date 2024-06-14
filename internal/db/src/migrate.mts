import "dotenv/config"

import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"

/**
 * Use for migrating custom sql (mainly RLS or stuff not supported by Drizzle yet)
 */
async function main() {
  const migrationConnection = postgres(process.env.DATABASE_URL_MIGRATOR!, {
    max: 1,
  })
  const db = drizzle(migrationConnection, { logger: true })

  await migrate(db, { migrationsFolder: "src/custom" })

  process.exit(0)
}

main().catch((e) => {
  console.error("Migration failed")
  console.error(e)
  process.exit(1)
})
