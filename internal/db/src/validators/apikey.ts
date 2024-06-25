import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import * as schema from "../schema"

export const insertApiKeySchema = createInsertSchema(schema.apikeys, {
  expiresAt: z.coerce.date().optional(),
  name: z.string().min(1),
  key: z.string().min(1),
})
export const selectApiKeySchema = createSelectSchema(schema.apikeys)

export const createApiKeySchema = insertApiKeySchema.pick({
  name: true,
  expiresAt: true,
})

export const selectApiKeyHeaderSchema = selectApiKeySchema.pick({
  id: true,
  projectId: true,
  key: true,
})

export type CreateApiKey = z.infer<typeof createApiKeySchema>
