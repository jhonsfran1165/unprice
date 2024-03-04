// TODO: export like this https://github.com/drizzle-team/drizzle-orm/issues/468
import { neonConfig, Pool } from "@neondatabase/serverless"
import { and, eq, getTableColumns, or, sql } from "drizzle-orm"
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless"

import { env } from "../env.mjs"
import * as schema from "./schema"

// if we're running locally
if (env.NODE_ENV === "development") {
  // Set the WebSocket proxy to work with the local instance
  neonConfig.wsProxy = (host) => `${host}:5433/v1`
  // Disable all authentication and encryption
  neonConfig.useSecureWebSocket = false
  neonConfig.pipelineTLS = false
  neonConfig.pipelineConnect = false
}

// support local development and neon serverless
export const db =
  env.NODE_ENV === "production"
    ? drizzleNeon(
        new Pool({
          connectionString: env.DATABASE_URL,
        }),
        {
          schema: schema,
          logger: env.DRIZZLE_LOG === "true",
        }
      )
    : drizzleNeon(
        new Pool({
          connectionString: env.DATABASE_URL_LOCAL,
        }),
        {
          schema: schema,
          logger: env.DRIZZLE_LOG === "true",
        }
      )

const projectGuardPrepared = db
  .select({
    project: getTableColumns(schema.projects),
    member: {
      ...getTableColumns(schema.users),
      role: schema.members.role,
    },
    workspace: getTableColumns(schema.workspaces),
  })
  .from(schema.projects)
  .limit(1)
  .where(
    and(
      eq(schema.projects.workspaceId, sql.placeholder("workspaceId")),
      eq(schema.users.id, sql.placeholder("userId")),
      or(
        eq(schema.projects.id, sql.placeholder("projectId")),
        eq(schema.projects.slug, sql.placeholder("projectSlug"))
      )
    )
  )
  .innerJoin(
    schema.workspaces,
    eq(schema.projects.workspaceId, schema.workspaces.id)
  )
  .innerJoin(
    schema.members,
    eq(schema.members.workspaceId, schema.workspaces.id)
  )
  .innerJoin(schema.users, eq(schema.members.userId, schema.users.id))
  .prepare("project_guard_prepared")

const workspaceGuardPrepared = db
  .select({
    member: {
      ...getTableColumns(schema.users),
      role: schema.members.role,
    },
    workspace: getTableColumns(schema.workspaces),
  })
  .from(schema.workspaces)
  .limit(1)
  .where(
    and(
      or(
        eq(schema.workspaces.id, sql.placeholder("workspaceId")),
        eq(schema.workspaces.slug, sql.placeholder("workspaceSlug"))
      ),
      eq(schema.users.id, sql.placeholder("userId"))
    )
  )
  .innerJoin(
    schema.members,
    eq(schema.members.workspaceId, schema.workspaces.id)
  )
  .innerJoin(schema.users, eq(schema.members.userId, schema.users.id))
  .prepare("workspace_guard_prepared")

const workspacesByUserPrepared = db.query.users
  .findFirst({
    with: {
      members: {
        columns: {
          role: true,
        },
        with: {
          workspace: {
            columns: {
              id: true,
              slug: true,
              isPersonal: true,
              name: true,
              plan: true,
            },
          },
        },
      },
    },
    where: (user, operators) =>
      operators.eq(user.id, sql.placeholder("userId")),
  })
  .prepare("workspaces_by_user_prepared")

export * from "drizzle-orm"
export { pgTableProject as tableCreator } from "./utils"

export const prepared = {
  workspacesByUserPrepared,
  projectGuardPrepared,
  workspaceGuardPrepared,
}
