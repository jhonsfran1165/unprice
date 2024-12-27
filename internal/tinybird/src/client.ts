import { Tinybird } from "@chronark/zod-bird"
import { env } from "./env"

export const tb = new Tinybird({
  token: env.TINYBIRD_TOKEN,
  baseUrl: env.TINYBIRD_URL,
})
