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

const projectSlug = z
  .string()
  .min(1, { message: "project slug has to be at least 1 characters" })
  .optional()

export const projectPostSchema = z.object({
  name,
  description,
})

export const projectGetSchema = z.object({
  orgSlug,
  projectSlug,
})

export type projectPostType = z.infer<typeof projectPostSchema>
