// TODO: export like this https://github.com/drizzle-team/drizzle-orm/issues/468
import { neonConfig, Pool } from "@neondatabase/serverless"
import { sql } from "drizzle-orm"
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless"

import * as dbSchemas from "./schema"
import * as utils from "./utils"

// activate connection caching
neonConfig.fetchConnectionCache = true

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  // idleTimeoutMillis: 0,
  // connectionTimeoutMillis: 0,
})

export const db = drizzleNeon(pool, {
  schema: dbSchemas,
  logger: process.env.DRIZZLE_LOG === "true",
})

export const projectsWithWorkspacesPrepared = db.query.projects
  .findFirst({
    where: (project, { eq, or }) =>
      or(
        eq(project.id, sql.placeholder("id")),
        eq(project.slug, sql.placeholder("slug"))
      ),
    with: {
      workspace: true,
    },
  })
  .prepare("projects_with_workspace")

export const workspacesByUserPrepared = db.query.users
  .findFirst({
    with: {
      usersToWorkspaces: {
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
  .prepare("workspaces_by_user")

export * from "drizzle-orm"
export { utils }
export const prepared = {
  workspacesByUserPrepared,
  projectsWithWorkspacesPrepared,
}
export const schema = { ...dbSchemas }
export { pgTableProject as tableCreator } from "./utils"
