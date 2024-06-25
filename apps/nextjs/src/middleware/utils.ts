import type { NextAuthRequest } from "@builderai/auth"
import type { NextRequest } from "next/server"

import { APP_BASE_DOMAIN } from "~/constants"

export const parse = (req: NextAuthRequest | NextRequest) => {
  let domain = req.headers.get("host")!
  domain = domain.replace("www.", "") // remove www. from domain

  if (domain === "app.localhost:3000" || domain.endsWith(".vercel.app")) {
    // for local development and preview URLs
    domain = APP_BASE_DOMAIN
  }

  const suddomain = domain.split(".")[0]
  const ip = req.ip ?? "127.0.0.1"
  const path = req.nextUrl.pathname

  // fullPath is the full URL path (along with search params)
  const searchParams = req.nextUrl.searchParams.toString()
  const fullPath = `${path}${searchParams.length > 0 ? `?${searchParams}` : ""}`

  // Here, we are using decodeURIComponent to handle foreign languages like Hebrew
  const key = decodeURIComponent(path.split("/")[1] ?? "") // key is the first part of the path
  const fullKey = decodeURIComponent(path.slice(1)) // fullKey is the full path without the first slash

  return { domain, path, fullPath, key, fullKey, suddomain, ip }
}

export const detectBot = (req: NextRequest) => {
  const url = req.nextUrl
  if (url.searchParams.get("bot")) return true
  const ua = req.headers.get("User-Agent")
  if (ua) {
    /* Note:
     * - bot is for most bots & crawlers
     * - facebookexternalhit is for Facebook crawler
     * - MetaInspector is for https://metatags.io/
     */
    return /bot|facebookexternalhit|google|baidu|bing|msn|duckduckbot|teoma|slurp|yandex|MetaInspector/i.test(
      ua
    )
  }
  return false
}
