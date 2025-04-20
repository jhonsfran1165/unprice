import { env } from "./env"

export const STAGES = ["prod", "test", "dev"] as const

const MAIN_DOMAIN = "unprice.dev"
const SITES_DOMAIN = "builderai.sh"

// sometimes we need to use the vercel env from the client
const VERCEL_ENV = env.NEXT_PUBLIC_VERCEL_ENV || env.VERCEL_ENV

export const BASE_DOMAIN =
  VERCEL_ENV === "production"
    ? MAIN_DOMAIN
    : VERCEL_ENV === "preview"
      ? `${env.NEXT_PUBLIC_APP_DOMAIN}`
      : "localhost:3000"

export const BASE_URL =
  VERCEL_ENV === "production"
    ? MAIN_DOMAIN
    : VERCEL_ENV === "preview"
      ? `https://${env.NEXT_PUBLIC_APP_DOMAIN}`
      : "http://localhost:3000"

export const APP_BASE_DOMAIN = `app.${BASE_DOMAIN}`

export const SITES_BASE_DOMAIN =
  VERCEL_ENV === "production"
    ? SITES_DOMAIN
    : VERCEL_ENV === "preview"
      ? SITES_DOMAIN
      : "localhost:3000"

export const APP_HOSTNAMES = new Set([
  `app.${MAIN_DOMAIN}`,
  `app.${env.NEXT_PUBLIC_APP_DOMAIN}`,
  // for preview deployments
  `app-${env.NEXT_PUBLIC_APP_DOMAIN}`,
  "app.localhost:3000",
])

export const APP_DOMAIN =
  VERCEL_ENV === "production"
    ? `https://app.${MAIN_DOMAIN}/`
    : VERCEL_ENV === "preview"
      ? `https://app-${env.NEXT_PUBLIC_APP_DOMAIN}/`
      : "http://app.localhost:3000/"

export const API_HOSTNAMES = new Set([
  `api.${MAIN_DOMAIN}`,
  `api.${env.NEXT_PUBLIC_APP_DOMAIN}`,
  // for preview deployments
  `api-${env.NEXT_PUBLIC_APP_DOMAIN}`,
  "api.localhost:3000",
])

export const API_DOMAIN =
  VERCEL_ENV === "production"
    ? `https://api.${MAIN_DOMAIN}/`
    : VERCEL_ENV === "preview"
      ? `https://api-${env.NEXT_PUBLIC_APP_DOMAIN}/`
      : "http://api.localhost:3000/"

export const AUTH_ROUTES = {
  SIGNIN: "/auth/signin",
  SIGNOUT: "/auth/signout",
  ERROR: "/auth/error",
  RESET: "/auth/reset",
  NEW_PASSWORD: "/auth/new-password",
}

export const RESTRICTED_SUBDOMAINS = new Set(["www", "app", "api", "sites", "builderai", "unprice"])

// export const APP_PUBLIC_ROUTES = new Set(["/opengraph-image.png", "/terms", "/pricing", "/privacy"])
export const APP_AUTH_ROUTES = new Set(Object.values(AUTH_ROUTES))
export const API_AUTH_ROUTE_PREFIX = "/api/auth"
export const API_TRPC_ROUTE_PREFIX = "/api/trpc"
export const DEFAULT_LOGIN_REDIRECT = "/"
export const APP_NON_WORKSPACE_ROUTES = new Set(["/error", "/new"])
export const APP_NAME = "unprice"

export const COOKIES_APP = {
  WORKSPACE: "workspace-slug",
  PROJECT: "project-slug",
}
