import { Unprice } from "@unprice/api"

import { env } from "~/env"

export const unprice = new Unprice({
  token: env.UNPRICE_API_KEY,
  baseUrl: env.NODE_ENV === "production" ? "https://api.unprice.dev" : "http://localhost:8787",
  cache: "force-cache",
})
