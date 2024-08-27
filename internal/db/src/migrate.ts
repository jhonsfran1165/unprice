import { eq } from "drizzle-orm"
import { db } from "."
import * as schema from "./schema"
import { newId } from "./utils"

import { migrate } from "drizzle-orm/neon-serverless/migrator"

async function main() {
  await migrate(db, { migrationsFolder: "src/migrations/local" })

  const start = Date.now()
  console.info("⏳ Running migrations...")

  let userExists = await db.query.users
    .findFirst({
      where: (fields, operators) => operators.eq(fields.email, "jhonsfran@gmail.com"),
    })
    .then((user) => user ?? null)

  if (!userExists) {
    // create user
    const user = await db
      .insert(schema.users)
      .values({
        id: newId("user"),
        email: "jhonsfran@gmail.com",
        name: "sebastian franco",
        emailVerified: new Date(),
        image: "https://avatars.githubusercontent.com/u/28306808?v=4",
        theme: "dark",
        defaultWorkspaceSlug: "unprice-admin",
      })
      .onConflictDoNothing()
      .returning()
      .then((user) => user[0] ?? null)

    userExists = user
  }

  if (!userExists) throw "Error creating user"

  const unpriceWorkspace = await db.query.workspaces.findFirst({
    where: (fields, operators) => operators.eq(fields.slug, "unprice-admin"),
  })

  const workspaceId = unpriceWorkspace?.id ?? newId("workspace")
  let workspace: typeof schema.workspaces.$inferSelect | null = null

  if (!unpriceWorkspace?.id) {
    // create
    workspace = await db
      .insert(schema.workspaces)
      .values({
        id: workspaceId,
        slug: "unprice-admin",
        name: "unprice",
        isPersonal: false,
        imageUrl: "https://avatars.githubusercontent.com/u/28306808?v=4",
        unPriceCustomerId: "",
        enabled: true,
        isInternal: true,
        isMain: true,
        createdBy: userExists.id,
        plan: "PRO",
      })
      .returning()
      .then((workspace) => workspace[0] ?? null)
  } else {
    // update
    workspace = await db
      .update(schema.workspaces)
      .set({
        imageUrl: "https://avatars.githubusercontent.com/u/28306808?v=4",
        isPersonal: false,
        isInternal: true,
        enabled: true,
        isMain: true,
        plan: "PRO",
      })
      .where(eq(schema.workspaces.id, workspaceId))
      .returning()
      .then((workspace) => workspace[0] ?? null)
  }

  if (!workspace) throw "Error creating workspace"

  const member = await db.query.members.findFirst({
    where: (fields, operators) =>
      operators.and(
        operators.eq(fields.userId, userExists.id),
        operators.eq(fields.workspaceId, workspace.id)
      ),
  })

  if (!member) {
    // add the user as a member of the workspace
    await db
      .insert(schema.members)
      .values({
        userId: userExists.id,
        workspaceId: workspace.id,
        role: "OWNER",
      })
      .onConflictDoNothing()
  }

  const unpriceProject = await db.query.projects.findFirst({
    where: (fields, operators) => operators.eq(fields.slug, "unprice-admin"),
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
        slug: "unprice-admin",
        workspaceId: workspaceId,
        url: "https://unprice.dev",
        enabled: true,
        isInternal: true,
        isMain: true,
        defaultCurrency: "USD",
        timezone: "UTC",
      })
      .returning()
      .then((project) => project[0] ?? null)
  } else {
    // update
    project = await db
      .update(schema.projects)
      .set({
        isMain: true,
        enabled: true,
        isInternal: true,
        defaultCurrency: "USD",
        timezone: "UTC",
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
        email: userExists.email,
        stripeCustomerId: "cus_QCzIbAwmpxZeEA",
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

  // print all relevant data and save it to unfisical
  const end = Date.now()

  console.info(`✅ Migrations completed in ${end - start}ms`)

  console.info("Project Id: ", project.id)
  console.info("Workspace Id: ", workspace.id)
  console.info("Customer Id: ", unpriceOwner.id)

  process.exit(0)
}

main().catch((e) => {
  console.error("Migration failed")
  console.error(e)
  process.exit(1)
})
