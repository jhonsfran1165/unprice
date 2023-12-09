import { relations } from "drizzle-orm"
import type { NeonDatabase } from "drizzle-orm/neon-serverless"
import { index, json, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core"
import { createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import type * as schema from "../schema"
import { projectID, tenantID, timestamps } from "../utils/sql"
import { project } from "./project"

export const test = pgTable(
  "test",
  {
    ...projectID,
    ...tenantID,
    ...timestamps,
    slug: text("slug").notNull().unique(),
    content: json("content"),
  },
  (table) => {
    return {
      testProjectInx: index("test_project_id_idx").on(table.projectId),
      testInx: uniqueIndex("test_key_slug").on(table.slug),
      testTenantIdInx: index("test_tenant_uidx").on(table.tenantId),
    }
  }
)

export const TestRelations = relations(test, ({ one }) => ({
  project: one(project, {
    fields: [test.projectId],
    references: [project.id],
  }),
}))

export const Test = createSelectSchema(test, {
  id: (schema) => schema.id.cuid2(),
  slug: (schema) =>
    schema.slug
      .trim()
      .toLowerCase()
      .min(3)
      .regex(/^[a-z0-9\-]+$/),
})

export const createTestchemas = Test.pick({
  slug: true,
  id: true,
  tenantId: true,
  projectId: true,
}).partial({
  id: true,
})

export const createTestchema = Test.pick({
  slug: true,
  id: true,
  content: true,
  tenantId: true,
  projectId: true,
})

export type CreateTest = z.infer<typeof createTestchema>

export const updateTestchema = z.object({
  id: z.string(),
  projectSlug: z.string().optional(),
  slug: z.string().optional(),
  content: z.string(),
})

// TODO: create crud functions for the test table
export const createTest = async (
  tx: NeonDatabase<typeof schema>,
  input: CreateTest
) => {
  // const id = input.id ?? createId()
  const result = await tx.insert(test).values({
    id: input.id,
    slug: input.slug,
    content: input.content,
    tenantId: "input.tenantId",
    projectId: "input.projectId",
  })

  return result
}
