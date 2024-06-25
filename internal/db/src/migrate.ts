import { eq } from "drizzle-orm"
import { db } from "."
import * as schema from "./schema"
import { newId } from "./utils"

// import { migrate } from "drizzle-orm/neon-serverless/migrator"

async function main() {
  // await migrate(db, { migrationsFolder: "src/migrations/custom" })

  // process.exit(0)

  const defaultProjectId = "proj_uhV7tetPJwCZAMox3L7Po4H5dgc"

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

  const member = await db.query.members.findFirst({
    where: (fields, operators) =>
      operators.and(
        operators.eq(fields.userId, user.id),
        operators.eq(fields.workspaceId, workspace.id)
      ),
  })

  if (!member) {
    // add the user as a member of the workspace
    await db
      .insert(schema.members)
      .values({
        userId: user.id,
        workspaceId: workspace.id,
        role: "OWNER",
      })
      .onConflictDoNothing()
  }

  const unpriceProject = await db.query.projects.findFirst({
    where: (fields, operators) => operators.eq(fields.slug, "unprice-admin"),
  })

  const unpriceProjectId = unpriceProject?.id ?? defaultProjectId
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
        id: "cus_2GGH1GE4864s4GrX6ttkjbStDP3k",
        name: "unprice",
        projectId: project.id,
        email: user.email,
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

  // create features

  // create a plan

  // subscribe to the free plan
  // await db.insert(subscriptions).values({
  //   customerId: customer.id,
  //   planId: "free",
  //   status: "ACTIVE",
  //   createdAt: new Date(),
  //   updatedAt: new Date(),
  // })

  // print all relevant data and save it to unfisical

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
