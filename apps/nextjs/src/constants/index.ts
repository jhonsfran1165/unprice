import { env } from "../env.mjs"

// TODO: this to constants inside config package

export const PAGES_BASE_DOMAIN = env.NEXT_PUBLIC_APP_DOMAIN
export const APP_BASE_DOMAIN = `app.${env.NEXT_PUBLIC_APP_DOMAIN}`

export const APP_HOSTNAMES = new Set([
  "app.builderai.sh",
  `app.${env.NEXT_PUBLIC_APP_DOMAIN}`,
  "app.localhost:3000",
])

export const APP_DOMAIN =
  env.VERCEL_ENV === "production"
    ? "https://app.builderai.sh/"
    : env.VERCEL_ENV === "preview"
      ? `https://${env.NEXT_PUBLIC_APP_DOMAIN}`
      : "http://app.localhost:3000/"

export const API_HOSTNAMES = new Set([
  "api.builderai.sh",
  `api.${env.NEXT_PUBLIC_APP_DOMAIN}`,
  "api.localhost:3000",
])

export const SITES_HOSTNAMES = new Set([
  "sites.builderai.sh",
  `sites.${env.NEXT_PUBLIC_APP_DOMAIN}`,
  "sites.localhost:3000",
])

export const AUTH_ROUTES = {
  SIGNIN: "/auth/signin",
  SIGNOUT: "/auth/signout",
  ERROR: "/auth/error",
  RESET: "/auth/reset",
  NEW_PASSWORD: "/auth/new-password",
}

export const RESTRICTED_SUBDOMAINS = new Set(["www", "app", "api", "sites", "builderai"])

// export const APP_PUBLIC_ROUTES = new Set(["/opengraph-image.png", "/terms", "/pricing", "/privacy"])
export const APP_AUTH_ROUTES = new Set(Object.values(AUTH_ROUTES))
export const API_AUTH_ROUTE_PREFIX = "/api/auth"
export const API_TRPC_ROUTE_PREFIX = "/api/trpc"
export const DEFAULT_LOGIN_REDIRECT = "/"
export const APP_NON_WORKSPACE_ROUTES = new Set(["/error"])
