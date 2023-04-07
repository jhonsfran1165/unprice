import useOrganizationExist from "@/hooks/use-organization-exist"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

export const orgProfileGetSchema = z.object({})

// TODO: separate fields and use them like here https://github.com/colinhacks/zod/issues/42

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
  orgSlug: z.string().min(3, {
    message:
      "invalid slug for the organization, it has to be at least 3 characters",
  }),
})

export const orgCreatePostSchema = z.object({
  id: z.number().nullable(),
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
  image: z.string().url().nullable(),
  description: z.string().nullable(),
})
// .transform((schema) => {
//   schema.image = schema.image
//     ? schema.image
//     : `https://avatar.vercel.sh/${schema.slug}`

//   return schema
// })

export type orgCreatePostType = z.infer<typeof orgCreatePostSchema>
