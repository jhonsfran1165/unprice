import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

export const orgProfileGetSchema = z.object({})

export const orgGetSchama = z.object({
  orgSlug: z.string().min(1, {
    message:
      "invalid name for the organization, it has to be at least 3 characters",
  }),
})

export const orgBySlugGetSchema = z.object({
  orgSlug: z.string().min(1, {
    message:
      "invalid name for the organization, it has to be at least 3 characters",
  }),
})

export const orgBySlugPostSchema = z.object({
  slug: z.string().min(3, {
    message:
      "invalid slug for the organization, it has to be at least 3 characters",
  }),
})

export const orgCreatePostSchema = z.object({
  name: z.string().min(3, {
    message:
      "invalid name for the organization, it has to be at least 3 characters",
  }),
  slug: z.string().min(3, {
    message:
      "invalid slug for the organization, it has to be at least 3 characters",
  }),
  type: z.string().min(3, {
    message:
      "invalid type for the organization, it has to be at least 3 characters",
  }),
  image: z.string().url(),
  description: z.string(),
})

export type orgCreatePostType = z.infer<typeof orgCreatePostSchema>
