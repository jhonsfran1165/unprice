import { eq, relations } from "drizzle-orm"
import type { NeonDatabase } from "drizzle-orm/neon-serverless"
import { index, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core"
import { createSelectSchema } from "drizzle-zod"
import type { z } from "zod"

import type * as schema from "../../schema"
import { projectID, tenantID, timestamps } from "../../utils/sql"
import { project } from "../project"

export const plan = pgTable(
  "plan",
  {
    ...projectID,
    ...tenantID,
    ...timestamps,
    slug: text("slug").notNull().unique(),
    title: text("title"),
  },
  (table) => ({
    planProjectInx: index("plan_project_id_idx").on(table.projectId),
    planInx: uniqueIndex("plan_key_slug").on(table.slug),
    planTenantIdInx: index("plan_tenant_uidx").on(table.tenantId),
  })
)

export const planRelations = relations(plan, ({ one }) => ({
  project: one(project, {
    fields: [plan.projectId],
    references: [project.id],
  }),
}))

export const Plan = createSelectSchema(plan, {
  id: (schema) => schema.id.cuid2(),
  slug: (schema) =>
    schema.slug
      .trim()
      .toLowerCase()
      .min(3)
      .regex(/^[a-z0-9\-]+$/),
})

export const createPlanSchema = Plan.pick({
  slug: true,
  id: true,
  content: true,
  tenantId: true,
  projectId: true,
})

export type CreatePlan = z.infer<typeof createPlanSchema>

export const updatePlanSchema = Plan.pick({
  slug: true,
  id: true,
  content: true,
  tenantId: true,
  projectId: true,
}).partial({
  slug: true,
  projectSlug: true,
})

export type UpdatePlan = z.infer<typeof updatePlanSchema>

export const createPlan = async (
  tx: NeonDatabase<typeof schema>,
  input: CreatePlan
) => {
  const result = await tx.insert(plan).values({
    id: input.id,
    slug: input.slug,
    content: input.content,
    tenantId: input.tenantId,
    projectId: input.projectId,
  })

  return result
}

export const updatePlan = async (
  tx: NeonDatabase<typeof schema>,
  input: UpdatePlan
) => {
  const result = await tx
    .update(plan)
    .set({
      slug: input.slug,
      content: input.content,
      tenantId: input.tenantId,
      projectId: input.projectId,
    })
    .where(eq(plan.id, input.id))

  return result
}
