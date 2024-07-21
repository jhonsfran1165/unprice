import { Pool, neonConfig } from "@neondatabase/serverless"
import * as schema from "@unprice/db/schema"
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless"
import { env } from "env.mjs"
import ws from "ws"

neonConfig.webSocketConstructor = typeof WebSocket !== "undefined" ? WebSocket : ws

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

export const connectDatabase = () =>
  drizzleNeon(
    new Pool({
      // TODO: use read replica here
      connectionString: env.DATABASE_READ1_URL,
    }),
    {
      schema: schema,
    }
  )

export * from "@unprice/db"
