import * as z from "zod"

export const ogImageSchema = z.object({
  heading: z.string().min(1, {
    message: "heading is required",
  }),
  type: z.string().min(1, {
    message: "type is required",
  }),
  mode: z.enum(["light", "dark"]).default("dark"),
})
