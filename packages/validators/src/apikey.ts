import { createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import { schema } from "@builderai/db"

export const createApiKeySchema = z.object({
  projectSlug: z.string(),
  name: z.string(),
  expiresAt: z.date().optional(),
  tenantId: z.string().optional(),
})

export const selectApiKeySchema = createSelectSchema(schema.apikey)

export const selectApiKeyHeaderSchema = selectApiKeySchema.pick({
  id: true,
  projectId: true,
  key: true,
})

export type CreateApiKey = z.infer<typeof createApiKeySchema>
