// TODO: export like this https://github.com/drizzle-team/drizzle-orm/issues/468
import { Pool, neonConfig } from "@neondatabase/serverless"
// import { drizzle as drizzleHttp } from "drizzle-orm/neon-http"
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless"
import { withReplicas } from "drizzle-orm/pg-core"
import ws from "ws"
import { env } from "../env.mjs"
import * as schema from "./schema"

// TODO: need to check if this is needed
// export const http = neon(env.DATABASE_PRIMARY_URL)
// export const dbHttp = drizzleHttp(http)

neonConfig.webSocketConstructor = typeof WebSocket !== "undefined" ? WebSocket : ws

// if we're running locally
if (env.NODE_ENV === "development") {
  // Set the WebSocket proxy to work with the local instance
  neonConfig.wsProxy = (host) => {
    return `${host}:5433/v1?address=db:5432`
  }
  // Disable all authentication and encryption
  neonConfig.useSecureWebSocket = false
  neonConfig.pipelineTLS = false
  neonConfig.pipelineConnect = false
}

export const primary =
  env.NODE_ENV === "production"
    ? drizzleNeon(
        new Pool({
          connectionString: env.DATABASE_PRIMARY_URL,
        }),
        {
          schema: schema,
          logger: env.DRIZZLE_LOG === "true",
        }
      )
    : drizzleNeon(
        new Pool({
          connectionString: env.DATABASE_URL_LOCAL,
        }).on("error", (err) => {
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
  env.NODE_ENV === "production"
    ? withReplicas(primary, [read1, read2])
    : withReplicas(primary, [primary])

export * from "drizzle-orm"
export { pgTableProject as tableCreator } from "./utils"
export type Database = typeof db
