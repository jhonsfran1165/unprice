import { featureSelectBaseSchema } from "@unprice/db/validators"
import { z } from "zod"

export const getProjectFeaturesRequestSchema = z.object({
  projectId: z.string(),
})
export type GetProjectFeaturesRequest = z.infer<typeof getProjectFeaturesRequestSchema>

export const getProjectFeaturesResponseSchema = z.object({
  features: featureSelectBaseSchema.omit({ createdAtM: true, updatedAtM: true }).array(),
})
export type GetProjectFeaturesResponse = z.infer<typeof getProjectFeaturesResponseSchema>
