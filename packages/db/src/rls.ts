import { sql } from "drizzle-orm"
import type { NeonDatabase } from "drizzle-orm/neon-serverless"

import type * as schema from "./schema"

/**
 * set DB client and current tenantId and return a helper function that
 * can be use to emulate RLS. Use it in TRPC context for transaction with RLS
 */
export function authTxn(db: NeonDatabase<typeof schema>, tenantId: string) {
  /**
   * Execute transaction in an authenticated context.
   * This will set app.tenantId for the duration of a single transaction to
   * enable RLS (Row Level Security).
   *
   * this is a temporary solution until drizzle implements RLS
   * https://github.com/drizzle-team/drizzle-orm/issues/594
   */
  return <Q>(
    cb: ({ txRLS }: { txRLS: NeonDatabase<typeof schema> }) => Q | Promise<Q>
  ): Promise<Q> => {
    return db.transaction(async (tx) => {
      // set tenantId
      await tx.execute(
        sql`SELECT set_config('app.tenantId', '${sql.raw(tenantId)}', TRUE)`
      )

      // set role to authenticated to target the RLS neon_superuser is the only I can use to don't bypass RLS
      await tx.execute(sql`SET LOCAL role 'neon_superuser'`)

      // This will be executed in an authenticated context.
      const callback = await cb({ txRLS: tx })

      // unset role for the default on so bypass RLS again
      await tx.execute(sql`SET LOCAL role 'authenticated'`)
      // unset tenantId
      await tx.execute(
        sql`SELECT set_config('app.tenantId', '${sql.raw("")}', TRUE)`
      )

      return callback
    })
  }
}

/**
 * set DB client and current tenantId and return a helper function that
 * can be use to activate RLS. Use it in TRPC context for opening a set of operations with RLS activated
 */
export function activateRLS(db: NeonDatabase<typeof schema>, tenantId: string) {
  /**
   * Execute transaction in an authenticated context.
   * This will set app.tenantId for the duration of a single transaction to
   * enable RLS (Row Level Security).
   *
   * this is a temporary solution until drizzle implements RLS
   * https://github.com/drizzle-team/drizzle-orm/issues/594
   */
  return (): Promise<void> => {
    return db.transaction(async (tx) => {
      // set tenantId
      await tx.execute(
        sql`SELECT set_config('app.tenantId', '${sql.raw(tenantId)}', FALSE)`
      )

      // set role to neon_superuser to target the RLS
      await tx.execute(sql`set SESSION role 'neon_superuser'`)
    })
  }
}

/**
 * set DB client to set the role and custom parameters in the postgres configuration to default
 */
export function deactivateRLS(db: NeonDatabase<typeof schema>) {
  /**
   * Execute transaction in an authenticated context.
   * This will set app.tenantId for the duration of a single transaction to
   * enable RLS (Row Level Security).
   *
   * this is a temporary solution until drizzle implements RLS
   * https://github.com/drizzle-team/drizzle-orm/issues/594
   */
  return (): Promise<void> => {
    return db.transaction(async (tx) => {
      await tx.execute(sql`RESET SESSION AUTHORIZATION`)

      // set role to authenticated to bypass RLS again
      await tx.execute(sql`set SESSION role 'authenticated'`)

      // unset tenantId
      await tx.execute(
        sql`SELECT set_config('app.tenantId', '${sql.raw("")}', FALSE)`
      )
    })
  }
}
