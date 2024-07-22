import { RESTRICTED_SUBDOMAINS } from "@unprice/config"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"
import { pages } from "../schema/pages"

export const pageContentSchema = z.object({
  planVersions: z.array(z.string()),
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
})

export const pageInsertBaseSchema = createInsertSchema(pages, {
  customDomain: domainSchema.optional(),
  subdomain: subdomainSchema,
  title: z.string().min(3).max(50),
})
  .omit({
    createdAt: true,
    updatedAt: true,
    slug: true,
  })
  .partial({
    id: true,
    projectId: true,
  })

export type InsertPage = z.infer<typeof pageInsertBaseSchema>
export type Page = z.infer<typeof pageSelectBaseSchema>
