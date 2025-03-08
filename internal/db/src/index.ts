import { Pool, neonConfig } from "@neondatabase/serverless"
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless"
import { withReplicas } from "drizzle-orm/pg-core"
import ws from "ws"
import { env } from "../env.mjs"
import * as schema from "./schema"

neonConfig.webSocketConstructor = typeof WebSocket !== "undefined" ? WebSocket : ws

// TODO: fix push command in drizzle-kit
// if we're running locally
if (env.NODE_ENV === "development" && env.VERCEL_ENV === "development") {
  // Set the WebSocket proxy to work with the local instance
  neonConfig.wsProxy = (host) => {
    return `${host}:5433/v1?address=db:5432`
  }
  // neonConfig.wsProxy = "ws://localhost:5433/v1"
  // Disable all authentication and encryption
  neonConfig.useSecureWebSocket = false
  neonConfig.pipelineTLS = false
  neonConfig.pipelineConnect = false
}

const poolConfig = {
  connectionString: env.DATABASE_URL,
  connectionTimeoutMillis: 30000,
  keepAlive: true,
}

export const primary = drizzleNeon(
  new Pool(poolConfig).on("error", (err) => {
    console.error("Database error:", err)
  }),
  {
    schema: schema,
    logger: env.DRIZZLE_LOG === "true",
  }
)

export const read1 = drizzleNeon(
  new Pool({
    connectionString: env.DATABASE_READ1_URL,
  }),
  {
    schema: schema,
    logger: env.DRIZZLE_LOG === "true",
  }
)

export const read2 = drizzleNeon(
  new Pool({
    connectionString: env.DATABASE_READ2_URL,
  }),
  {
    schema: schema,
    logger: env.DRIZZLE_LOG === "true",
  }
)

export const db =
  env.NODE_ENV === "production" && env.VERCEL_ENV === "production"
    ? withReplicas(primary, [read1, read2])
    : withReplicas(primary, [primary])

// TODO: add custom logger https://orm.drizzle.team/docs/goodies#logging
export * from "drizzle-orm"
export { pgTableProject as tableCreator } from "./utils"
export type Database = typeof db
export type TransactionDatabase = Parameters<Parameters<Database["transaction"]>[0]>[0]
