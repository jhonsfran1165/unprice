import * as schema from "@builderai/db/schema"
import { newId } from "@builderai/db/utils"
import { Pool, neonConfig } from "@neondatabase/serverless"
import { eq } from "drizzle-orm"
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless"
import ws from "ws"

// Set the WebSocket proxy to work with the local instance
neonConfig.wsProxy = (host) => `${host}:5433/v1`
// Disable all authentication and encryption
neonConfig.useSecureWebSocket = false
neonConfig.pipelineTLS = false
neonConfig.pipelineConnect = false
neonConfig.webSocketConstructor = ws

async function main() {
  const db = drizzleNeon(
    new Pool({
      connectionString: process.env.DATABASE_URL_MIGRATOR_LOCAL,
    }),
    {
      schema: schema,
    }
  )

  // await migrate(db, { migrationsFolder: "migrations/custom" })

  // create user
  const user = await db
    .insert(schema.users)
    .values({
      id: newId("user"),
      email: "jhonsfran@gmail.com",
      name: "sebastian franco",
      emailVerified: new Date(),
      image: "",
      theme: "dark",
      defaultWorkspaceSlug: "unprice",
    })
    .onConflictDoNothing()
    .returning()
    .then((user) => user[0] ?? null)

  if (!user) throw "Error creating user"

  const unpriceWorkspace = await db.query.workspaces.findFirst({
    where: (fields, operators) => operators.eq(fields.slug, "unprice"),
  })

  const workspaceId = unpriceWorkspace?.id ?? newId("workspace")
  let workspace: typeof schema.workspaces.$inferSelect | null = null

  if (!unpriceWorkspace?.id) {
    // create
    workspace = await db
      .insert(schema.workspaces)
      .values({
        id: workspaceId,
        slug: "unprice",
        name: "unprice",
        isPersonal: false,
        imageUrl: "",
        unPriceCustomerId: "",
        plan: "PRO",
        enabled: true,
        isInternal: true,
        createdBy: user.id,
      })
      .returning()
      .then((workspace) => workspace[0] ?? null)
  } else {
    // update
    workspace = await db
      .update(schema.workspaces)
      .set({
        plan: "PRO",
        isPersonal: false,
        isInternal: true,
        enabled: true,
      })
      .where(eq(schema.workspaces.id, workspaceId))
      .returning()
      .then((workspace) => workspace[0] ?? null)
  }

  if (!workspace) throw "Error creating workspace"

  // add the user as a member of the workspace
  await db
    .insert(schema.members)
    .values({
      userId: user.id,
      workspaceId: workspace.id,
      role: "OWNER",
    })
    .onConflictDoNothing()

  const unpriceProject = await db.query.projects.findFirst({
    where: (fields, operators) => operators.eq(fields.slug, "unprice"),
  })

  const unpriceProjectId = unpriceProject?.id ?? newId("project")
  let project: typeof schema.projects.$inferSelect | null = null

  if (!unpriceProject?.id) {
    // create project
    project = await db
      .insert(schema.projects)
      .values({
        id: unpriceProjectId,
        name: "unprice",
        slug: "unprice",
        workspaceId: workspaceId,
        url: "",
        enabled: true,
        isInternal: true,
        defaultCurrency: "USD",
      })
      .returning()
      .then((project) => project[0] ?? null)
  } else {
    // update
    project = await db
      .update(schema.projects)
      .set({
        enabled: true,
        isInternal: true,
        defaultCurrency: "USD",
      })
      .where(eq(schema.projects.id, unpriceProjectId))
      .returning()
      .then((project) => project[0] ?? null)
  }

  if (!project) throw "Error creating project"

  // get user's email
  let unpriceOwner = await db.query.customers.findFirst({
    where: (fields, operators) => operators.eq(fields.email, "jhonsfran@gmail.com"),
  })

  if (!unpriceOwner) {
    unpriceOwner = await db
      .insert(schema.customers)
      .values({
        id: newId("customer"),
        name: "unprice",
        projectId: project.id,
        email: user.email,
      })
      .returning()
      .then((customer) => customer[0])
  }

  if (!unpriceOwner) throw "Error creating customer"

  // update workspace with the new customer
  await db
    .update(schema.workspaces)
    .set({ unPriceCustomerId: unpriceOwner.id })
    .where(eq(schema.workspaces.id, workspace.id))

  // create features

  // create a plan

  // subscribe to the free plan

  // print all relevant data and save it to unfisical

  process.exit(0)
}

main().catch((e) => {
  console.error("Migration failed")
  console.error(e)
  process.exit(1)
})
