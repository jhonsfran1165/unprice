import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";





// --------------------------------------------------------------------
const id = z.string()
const orgId = z.string()

const name = z
  .string()
  .min(3, { message: "projectName has to be at least 3 characters" })

const customDomain = z
  .string()
  .min(3, { message: "projectName has to be at least 3 characters" })

const subdomain = z
  .string()
  .min(3, { message: "projectName has to be at least 3 characters" })

const description = z
  .string()
  .min(6, { message: "description must be at least 6 characters" })
  .optional()

const slug = z
  .string()
  .min(1, { message: "project slug has to be at least 1 characters" })
  .optional()

const logo = z.string().url().optional()

export const projectPostSchema = z.object({
  slug,
  name,
  description,
  orgId,
  logo,
  customDomain,
  subdomain,
})

export const projectPutSchema = z.object({
  id,
  slug,
  name,
  description,
  orgId,
  logo,
  customDomain,
  subdomain,
})

export const projectGetSchema = z.object({
  id,
  slug,
  name,
  description,
  orgId,
  logo,
  customDomain,
  subdomain,
})

export type projectPostType = z.infer<typeof projectPostSchema>