import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import * as schema from "../schema"

export const insertProjectBaseSchema = createInsertSchema(schema.projects, {
  slug: z.string().min(1),
  name: z.string().min(1),
  url: z.string().url().optional(),
})

export const createProjectSchema = insertProjectBaseSchema.pick({
  name: true,
  url: true,
})

export const selectProjectSchema = createSelectSchema(schema.projects, {
  name: z.string().min(4, "Name must be at least 5 characters"),
})

export const renameProjectSchema = selectProjectSchema.pick({
  slug: true,
  name: true,
})

export const deleteProjectSchema = z.object({
  slug: z.string(),
})

export const transferToPersonalProjectSchema = z.object({
  slug: z.string(),
})

export const transferToWorkspaceSchema = z.object({
  projectSlug: z.string(),
  targetWorkspaceId: z.string(),
})

export type ProjectInsert = z.infer<typeof createProjectSchema>
export type Project = z.infer<typeof selectProjectSchema>
export type RenameProject = z.infer<typeof renameProjectSchema>
export type ProjectTransferToWorkspace = z.infer<
  typeof transferToWorkspaceSchema
>
export type ProjectTransferToPersonal = z.infer<
  typeof transferToPersonalProjectSchema
>
