import type { Logger } from "drizzle-orm/logger"

export class DBLogger implements Logger {
  logQuery(query: string, params: unknown[]): void {
    console.info(query, params)
  }
}
