import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import { schema } from "@builderai/db"

export const createProjectSchema = createInsertSchema(schema.projects, {
  id: z.string().optional(),
  slug: z.string().optional(),
  workspaceId: z.string().optional(),
  name: z.string(),
  url: z.string().url(),
})

export const selectProjectSchema = createSelectSchema(schema.projects)

export const renameProjectSchema = z.object({
  projectSlug: z.string(),
  name: z.string().min(4, "Name must be at least 5 characters"),
})

export const deleteProjectSchema = z.object({
  slug: z.string(),
})

export const transferToPersonalProjectSchema = z.object({
  slug: z.string(),
})

export const transferToWorkspaceSchema = z.object({
  projectSlug: z.string(),
})

export type ProjectInsert = z.infer<typeof createProjectSchema>
export type Project = z.infer<typeof selectProjectSchema>
export type RenameProject = z.infer<typeof renameProjectSchema>
export type ProjectTransferToWorkspace = z.infer<
  typeof transferToWorkspaceSchema
>
