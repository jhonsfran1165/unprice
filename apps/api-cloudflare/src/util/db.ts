import type { ConnectionDatabaseOptions } from "@unprice/db"
import { createConnection } from "@unprice/db"

export function createDb(opts: ConnectionDatabaseOptions) {
  return createConnection({
    env: opts.env,
    primaryDatabaseUrl: opts.primaryDatabaseUrl,
    read1DatabaseUrl: opts.read1DatabaseUrl,
    read2DatabaseUrl: opts.read2DatabaseUrl,
    logger: opts.logger,
  })
}
