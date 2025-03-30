import { Pool, neonConfig } from "@neondatabase/serverless"
import { type NeonDatabase, drizzle as drizzleNeon } from "drizzle-orm/neon-serverless"
import { type PgWithReplicas, withReplicas } from "drizzle-orm/pg-core"
import ws from "ws"
import * as schema from "./schema"

export type ConnectionDatabaseOptions = {
  env: "development" | "production" | "test"
  primaryDatabaseUrl: string
  read1DatabaseUrl?: string
  read2DatabaseUrl?: string
  logger: boolean
}

export type Database = NeonDatabase<typeof schema>
export type TransactionDatabase = Parameters<Parameters<Database["transaction"]>[0]>[0]

export function createConnection(opts: ConnectionDatabaseOptions): PgWithReplicas<Database> {
  neonConfig.webSocketConstructor = typeof WebSocket !== "undefined" ? WebSocket : ws

  if (opts.env === "development") {
    neonConfig.wsProxy = (host) => {
      return `${host}:5433/v1?address=db:5432`
    }
    neonConfig.useSecureWebSocket = false
    neonConfig.pipelineTLS = false
    neonConfig.pipelineConnect = false
  }

  const poolConfig = {
    connectionString: opts.primaryDatabaseUrl,
    connectionTimeoutMillis: 30000,
    keepAlive: true,
  }

  const primary = drizzleNeon(
    new Pool(poolConfig).on("error", (err) => {
      console.error("Database error:", err)
    }),
    {
      schema: schema,
      logger: opts.logger,
    }
  )

  const replicas: [typeof primary, ...(typeof primary)[]] = [primary]

  if (opts.read1DatabaseUrl) {
    replicas.push(
      drizzleNeon(
        new Pool({
          connectionString: opts.read1DatabaseUrl,
        }),
        {
          schema: schema,
          logger: opts.logger,
        }
      )
    )
  }

  if (opts.read2DatabaseUrl) {
    replicas.push(
      drizzleNeon(
        new Pool({
          connectionString: opts.read2DatabaseUrl,
        }),
        {
          schema: schema,
          logger: opts.logger,
        }
      )
    )
  }

  const db =
    opts.env === "production" && replicas.length > 0
      ? withReplicas(primary, replicas)
      : withReplicas(primary, [primary])

  return db
}

export * from "drizzle-orm"
export { pgTableProject as tableCreator } from "./utils"
