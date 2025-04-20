import { Pool, neonConfig } from "@neondatabase/serverless"
import { DefaultLogger } from "drizzle-orm"
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless"
import { withReplicas } from "drizzle-orm/pg-core"
import ws from "ws"
import * as schema from "./schema"

export type ConnectionDatabaseOptions = {
  env: "development" | "production" | "test" | "preview"
  primaryDatabaseUrl: string
  read1DatabaseUrl?: string
  read2DatabaseUrl?: string
  logger: boolean
}

export function createConnection(opts: ConnectionDatabaseOptions) {
  if (opts.env === "development") {
    // only for development when using node 20
    neonConfig.webSocketConstructor = typeof WebSocket !== "undefined" ? WebSocket : ws

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

  const logger = opts.logger ? new DefaultLogger() : false

  const primary = drizzleNeon(
    new Pool(poolConfig).on("error", (err) => {
      console.error("Database error:", err)
    }),
    {
      schema: schema,
      logger,
    }
  )

  const read1 = drizzleNeon(
    new Pool({
      connectionString: opts.read1DatabaseUrl,
    }),
    {
      schema: schema,
      logger,
    }
  )

  const read2 = drizzleNeon(
    new Pool({
      connectionString: opts.read2DatabaseUrl,
    }),
    {
      schema: schema,
      logger,
    }
  )

  const db =
    opts.env === "production" && opts.read1DatabaseUrl && opts.read2DatabaseUrl
      ? withReplicas(primary, [read1, read2])
      : withReplicas(primary, [primary])

  return db
}
