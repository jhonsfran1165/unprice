import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import type { OrganizationTypes } from "@/lib/types/supabase"

// **************************** FIELDS **************************** //
export const orgSlug = z.string().min(1, {
  message:
    "invalid name for the organization, it has to be at least 3 characters",
})

const name = z.string().min(3, {
  message:
    "invalid name for the organization, it has to be at least 3 characters",
})

const type = z
  .union([z.literal("STARTUP"), z.literal("PERSONAL"), z.literal("BUSSINESS")])
  .nullable()
const id = z.string()
const image = z.string().url()
const description = z.string()
const isDefault = z.boolean()

// -------------------------------------------------------------
export const orgGetSchema = z.object({})

export const orgDeleteSchema = z.object({
  orgSlug,
  id,
})

export const orgBySlugGetSchema = z.object({
  orgSlug,
})

export const orgPostSchema = z.object({
  id: id.nullable(),
  name,
  slug: orgSlug,
  type,
  image: image.nullable(),
  description: description.nullable(),
})

export const orgPutSchema = z.object({
  name,
  slug: orgSlug,
  type,
  image: image.nullable(),
  description: description.nullable(),
})

export const orgMakeDefaultSchema = z.object({
  id,
  is_default: isDefault,
})

export type orgMakeDefaultType = z.infer<typeof orgMakeDefaultSchema>
export type orgPostType = z.infer<typeof orgPostSchema>
export type orgPutType = z.infer<typeof orgPutSchema>
