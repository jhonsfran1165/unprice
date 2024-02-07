import { z } from "zod"

export const createCanvaSchema = z.object({
  id: z.string().optional(),
  projectSlug: z.string(),
  slug: z.string(),
  content: z.object({}),
})

export const updateCanvaSchema = z.object({
  id: z.string(),
  projectSlug: z.string().optional(),
  slug: z.string().optional(),
  content: z.string(),
})
export type CreateCanva = z.infer<typeof createCanvaSchema>
