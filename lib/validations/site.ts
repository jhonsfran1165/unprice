import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

export const siteCreateSchema = z.object({
  name: z
    .string()
    .min(3, { message: "SiteName has to be at least 3 characters" }),
  description: z
    .string()
    .min(6, { message: "description must be at least 6 characters" }),
})

export const siteGetSchema = z.object({
  siteId: z
    .string()
    .min(1, { message: "siteId has to be at least 1 characters" }),
})

export type siteCreateType = z.infer<typeof siteCreateSchema>
