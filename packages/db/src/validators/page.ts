import { z } from "zod"

export const createPageSchema = z.object({
  id: z.string().optional(),
  projectSlug: z.string(),
  html: z.string(),
  version: z.number().default(0),
})

export const updatePageSchema = z.object({
  id: z.string(),
  projectSlug: z.string(),
  html: z.string(),
  version: z.number().default(0),
})
export type CreatePage = z.infer<typeof createPageSchema>
