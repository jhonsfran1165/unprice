import { z } from "zod"

export const createApiKeySchema = z.object({
  projectSlug: z.string(),
  name: z.string(),
  expiresAt: z.date().optional(),
  tenantId: z.string().optional(),
})
export type CreateApiKey = z.infer<typeof createApiKeySchema>
