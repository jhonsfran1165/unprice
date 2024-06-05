import { env } from "@/lib/env"
import { primary } from "@builderai/db"
import * as schema from "@builderai/db/schema"
import { neon } from "@neondatabase/serverless"
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http"

export const connectDatabase = () => primary

export * from "@builderai/db"
