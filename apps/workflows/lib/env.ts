import { z } from "zod"

export function env() {
  const parsed = z
    .object({
      DATABASE_URL_LOCAL: z.string().min(1).url(),
      TRIGGER_API_KEY: z.string(),
      TINYBIRD_TOKEN: z.string(),
      STRIPE_API_KEY: z.string(),
      NODE_ENV: z.enum(["development", "production"]).default("development"),
    })
    .safeParse(process.env)
  if (!parsed.success) {
    throw new Error(`env: ${parsed.error.message}`)
  }
  return parsed.data
}
