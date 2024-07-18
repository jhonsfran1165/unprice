import type { NextAuthRequest } from "@builderai/auth"
import type { NextRequest } from "next/server"
import { BASE_DOMAIN, RESTRICTED_SUBDOMAINS } from "./../constants/index"

import { APP_BASE_DOMAIN } from "~/constants"

// validate the subdomain from the host and return it
// if the host is a custom domain, return the full domain
// if the subdomain is restricted or invalid, return null
export const getValidSubdomain = (host?: string | null) => {
  let subdomain: string | null = null

  // we should improve here for custom vercel deploy page
  if (host?.includes(".") && !host.includes(".vercel.app")) {
    const candidate = host.split(".")[0]
    if (candidate && !RESTRICTED_SUBDOMAINS.has(candidate)) {
      // Valid candidate
      subdomain = candidate
    }
  }

  // In case the host is a custom domain
  if (host && !host?.includes(BASE_DOMAIN)) {
    subdomain = host
  }

  return subdomain
}

export const parse = (req: NextAuthRequest | NextRequest) => {
  let domain = req.headers.get("host")!
  domain = domain.replace("www.", "") // remove www. from domain

  if (domain === "app.localhost:3000" || domain.endsWith(".vercel.app")) {
    // for local development and preview URLs
    domain = APP_BASE_DOMAIN
  }

  const subdomain = domain.split(".")[0] === domain ? null : domain.split(".")[0]
  const ip = req.ip ?? "127.0.0.1"
  const path = req.nextUrl.pathname

  // fullPath is the full URL path (along with search params)
  const searchParams = req.nextUrl.searchParams.toString()
  const fullPath = `${path}${searchParams.length > 0 ? `?${searchParams}` : ""}`

  // Here, we are using decodeURIComponent to handle foreign languages like Hebrew
  const key = decodeURIComponent(path.split("/")[1] ?? "") // key is the first part of the path
  const fullKey = decodeURIComponent(path.slice(1)) // fullKey is the full path without the first slash

  return { domain, path, fullPath, key, fullKey, subdomain, ip }
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

// courtesy of ChatGPT: https://sharegpt.com/c/pUYXtRs
export const validDomainRegex = new RegExp(
  /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/
)

export const getSubdomain = (name: string, apexName: string) => {
  if (name === apexName) return null
  return name.slice(0, name.length - apexName.length - 1)
}

export const getApexDomain = (url: string) => {
  let domain = ""
  try {
    domain = new URL(url).hostname
  } catch (_e) {
    return ""
  }
  const parts = domain.split(".")
  if (parts.length > 2) {
    // if it's a subdomain (e.g. dub.vercel.app), return the last 2 parts
    return parts.slice(-2).join(".")
  }
  // if it's a normal domain (e.g. dub.sh), we return the domain
  return domain
}
