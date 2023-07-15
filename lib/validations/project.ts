import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { orgSlug } from "@/lib/validations/org"

// --------------------------------------------------------------------
const name = z
  .string()
  .min(3, { message: "projectName has to be at least 3 characters" })

const description = z
  .string()
  .min(6, { message: "description must be at least 6 characters" })
  .nullable()
  .or(z.literal(''))

const slug = z
  .string()
  .min(1, { message: "project slug has to be at least 1 characters" })
  .optional()

const custom_domain = z.string()
const subdomain = z.string()
const logo = z.string().optional()

export const projectPostSchema = z.object({
  name,
  description,
  slug,
  custom_domain,
  subdomain,
  logo,
})

export const projectGetSchema = z.object({
  orgSlug,
})

export type projectPostType = z.infer<typeof projectPostSchema>