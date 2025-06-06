import { and, eq, getTableColumns, or, sql } from "drizzle-orm"
import type { Database } from "./index"
import * as schema from "./schema"

export function createProjectWorkspaceGuardQuery(db: Database) {
  return db
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
        eq(schema.users.id, sql.placeholder("userId")),
        or(
          eq(schema.projects.id, sql.placeholder("projectId")),
          eq(schema.projects.slug, sql.placeholder("projectSlug"))
        )
      )
    )
    .innerJoin(schema.workspaces, eq(schema.projects.workspaceId, schema.workspaces.id))
    .innerJoin(schema.members, eq(schema.members.workspaceId, schema.workspaces.id))
    .innerJoin(schema.users, eq(schema.members.userId, schema.users.id))
    .prepare("project_ws_guard_prepared")
}

export function createWorkspaceGuardQuery(db: Database) {
  return db
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
    .innerJoin(schema.members, eq(schema.members.workspaceId, schema.workspaces.id))
    .innerJoin(schema.users, eq(schema.members.userId, schema.users.id))
    .prepare("workspace_guard_prepared")
}

export function createWorkspacesByUserQuery(db: Database) {
  return db.query.users
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
                enabled: true,
                unPriceCustomerId: true,
                isInternal: true,
                isMain: true,
              },
            },
          },
        },
      },
      where: (user, operators) => operators.eq(user.id, sql.placeholder("userId")),
    })
    .prepare("workspaces_by_user_prepared")
}
