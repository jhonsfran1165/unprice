import { RESTRICTED_SUBDOMAINS } from "@unprice/config"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"
import { pages } from "../schema/pages"

const colorSchema = z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color")

export const pageContentSchema = z.object({
  planVersions: z.array(z.string()),
})

export const faqSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string(),
})

export const colorPaletteSchema = z.object({
  primary: colorSchema,
})

export const planSchema = z.object({
  id: z.string(),
  description: z.string().optional(),
  slug: z.string(),
  version: z.number(),
})

const domainSchema = z.coerce.string().refine((customDomain) => {
  if (!customDomain || customDomain === "") {
    return true
  }

  // custom domain regex
  const parsed = z
    .string()
    .regex(/^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/)
    .safeParse(customDomain)

  return parsed.success
}, "Invalid domain")

const subdomainSchema = z.coerce
  .string()
  .min(3)
  .max(20)
  .regex(/^[a-z0-9-]+$/)
  .refine((subdomain) => {
    if (RESTRICTED_SUBDOMAINS.has(subdomain)) {
      return false
    }

    return true
  }, "restricted subdomain")

export const pageSelectBaseSchema = createSelectSchema(pages, {
  customDomain: domainSchema.optional(),
  subdomain: subdomainSchema,
  colorPalette: colorPaletteSchema,
  faqs: faqSchema.array(),
  selectedPlans: planSchema.array(),
})

export const pageInsertBaseSchema = createInsertSchema(pages, {
  customDomain: domainSchema.optional(),
  subdomain: subdomainSchema,
  title: z.string().min(3).max(50),
  colorPalette: colorPaletteSchema,
  faqs: faqSchema.array(),
  selectedPlans: planSchema.array(),
})
  .omit({
    createdAtM: true,
    updatedAtM: true,
    slug: true,
    published: true,
  })
  .partial({
    copy: true,
    selectedPlans: true,
    faqs: true,
    colorPalette: true,
    logo: true,
    font: true,
    id: true,
    projectId: true,
    logoType: true,
  })

export type InsertPage = z.infer<typeof pageInsertBaseSchema>
export type Page = z.infer<typeof pageSelectBaseSchema>
