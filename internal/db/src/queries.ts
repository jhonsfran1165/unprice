import { and, eq, getTableColumns, or, sql } from "drizzle-orm"
import { db } from "."
import * as schema from "./schema"

const projectWorkspaceGuardPrepared = db
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
  .innerJoin(schema.members, eq(schema.members.workspaceId, schema.workspaces.id))
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
              enabled: true,
              unPriceCustomerId: true,
            },
          },
        },
      },
    },
    where: (user, operators) => operators.eq(user.id, sql.placeholder("userId")),
  })
  .prepare("workspaces_by_user_prepared")

const apiKeyPrepared = db.query.apikeys
  .findFirst({
    with: {
      project: {
        columns: {
          workspaceId: true,
          id: true,
          enabled: true,
          slug: true,
          defaultCurrency: true,
          isMain: true,
          isInternal: true,
        },
        with: {
          workspace: {
            columns: {
              enabled: true,
              unPriceCustomerId: true,
              isPersonal: true,
              isInternal: true,
              isMain: true,
            },
          },
        },
      },
    },
    columns: {
      id: true,
      projectId: true,
      key: true,
      expiresAt: true,
      revokedAt: true,
      hash: true,
    },
    where: (apikey, { and, eq }) => and(eq(apikey.key, sql.placeholder("apikey"))),
  })
  .prepare("apikey_prepared")

export {
  apiKeyPrepared,
  projectWorkspaceGuardPrepared,
  workspaceGuardPrepared,
  workspacesByUserPrepared,
}
