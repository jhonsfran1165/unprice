import { env } from "./env.mjs"

export const CURRENCIES = ["USD", "EUR", "GBP"] as const
export const STAGES = ["prod", "test", "dev"] as const
export const STATUS_PLAN = ["draft", "published", "archived"] as const
export const STATUS_SUBSCRIPTION = ["active", "inactive"] as const

export const APP_DOMAIN =
  env.VERCEL_ENV === "production"
    ? "https://app.builderai.sh/"
    : env.VERCEL_ENV === "preview"
      ? `https://${env.NEXT_PUBLIC_APP_DOMAIN}`
      : `http://app.localhost:3000/`
