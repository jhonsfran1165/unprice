import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import * as schema from "../schema"
import { workspaceSelectBase } from "./workspace"

export const projectInserBaseSchema = createInsertSchema(schema.projects, {
  slug: z.string().min(1),
  name: z.string().min(1),
  url: z.string().url().optional(),
})

export const createProjectSchema = projectInserBaseSchema
  .omit({
    createdAt: true,
    updatedAt: true,
  })
  .pick({
    name: true,
    url: true,
  })

export const projectSelectBaseSchema = createSelectSchema(schema.projects, {
  name: z.string().min(4, "Name must be at least 5 characters"),
})

export const renameProjectSchema = projectSelectBaseSchema.pick({
  slug: true,
  name: true,
})

export const projectExtendedSelectSchema = projectSelectBaseSchema
  .pick({
    id: true,
    enabled: true,
    workspaceId: true,
    slug: true,
  })
  .extend({
    workspace: workspaceSelectBase.pick({
      unPriceCustomerId: true,
      enabled: true,
      plan: true,
      isPersonal: true,
    }),
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
export type Project = z.infer<typeof projectSelectBaseSchema>
export type RenameProject = z.infer<typeof renameProjectSchema>
export type ProjectTransferToWorkspace = z.infer<
  typeof transferToWorkspaceSchema
>
export type ProjectTransferToPersonal = z.infer<
  typeof transferToPersonalProjectSchema
>

export type ProjectExtended = z.infer<typeof projectExtendedSelectSchema>
