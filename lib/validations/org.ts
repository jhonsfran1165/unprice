import * as z from "zod"

import { ORGANIZATION_ROLES, ORGANIZATION_TYPES } from "@/lib/config/layout"

// **************************** FIELDS **************************** //
export const orgSlug = z.string().min(1, {
  message:
    "invalid name for the organization, it has to be at least 3 characters",
})

const name = z.string().min(3, {
  message:
    "invalid name for the organization, it has to be at least 3 characters",
})

const ORG_TYPES = Object.keys(ORGANIZATION_TYPES) as unknown as readonly [
  string,
  ...string[]
]

const ORG_ROLES = Object.keys(ORGANIZATION_ROLES) as unknown as readonly [
  string,
  ...string[]
]

const role = z.enum(ORG_ROLES)
const type = z.enum(ORG_TYPES)

const id = z.string()
const profileId = z.string()
const image = z.string().url()
const isDefault = z.boolean()
const description = z.string().min(0).max(160, {
  message: "description must not be longer than 160 characters.",
})

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
  description: description,
})

export const orgPutSchema = z.object({
  name,
  slug: orgSlug,
  type,
  image: image.nullable(),
  description: description,
})

export const orgMakeDefaultSchema = z.object({
  id,
  is_default: isDefault,
})

export const orgChangeRoleSchema = z.object({
  id,
  role: role,
  profileId,
})

export type orgMakeDefaultType = z.infer<typeof orgMakeDefaultSchema>
export type orgChangeRoleType = z.infer<typeof orgChangeRoleSchema>
export type orgPostType = z.infer<typeof orgPostSchema>
export type orgPutType = z.infer<typeof orgPutSchema>
