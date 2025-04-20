import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import * as schema from "../schema"
import { projectExtendedSelectSchema } from "./project"

export const insertApiKeySchema = createInsertSchema(schema.apikeys, {
  name: z.string().min(1),
  key: z.string().min(1),
})
export const selectApiKeySchema = createSelectSchema(schema.apikeys)

export const createApiKeySchema = insertApiKeySchema
  .pick({
    name: true,
    expiresAt: true,
  })
  .extend({
    projectSlug: z.string().optional(),
  })

export const selectApiKeyHeaderSchema = selectApiKeySchema.pick({
  id: true,
  projectId: true,
  key: true,
})

export const apiKeyExtendedSelectSchema = selectApiKeySchema
  .pick({
    id: true,
    projectId: true,
    key: true,
    expiresAt: true,
    revokedAt: true,
    hash: true,
  })
  .extend({
    project: projectExtendedSelectSchema,
  })

export type CreateApiKey = z.infer<typeof createApiKeySchema>
export type ApiKey = z.infer<typeof selectApiKeySchema>
export type ApiKeyExtended = z.infer<typeof apiKeyExtendedSelectSchema>
