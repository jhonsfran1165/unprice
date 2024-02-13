import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import { schema } from "@builderai/db"

export const insertApiKeySchema = createInsertSchema(schema.apikeys)
export const selectApiKeySchema = createSelectSchema(schema.apikeys)

export const createApiKeySchema = insertApiKeySchema
  .pick({
    name: true,
  })
  .extend({
    projectSlug: z.string(),
    expiresAt: z.date().optional(),
  })

export const selectApiKeyHeaderSchema = selectApiKeySchema.pick({
  id: true,
  projectId: true,
  key: true,
})

export type CreateApiKey = z.infer<typeof createApiKeySchema>
