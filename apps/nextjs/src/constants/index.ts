import { env } from "../env.mjs"

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

/**
 * An array of routes that are accessible to the public
 * These routes do not require authentication
 * @type {string[]}
 */
export const APP_PUBLIC_ROUTES = new Set(["/opengraph-image.png", "/terms", "/pricing", "/privacy"])

export const AUTH_ROUTES = {
  SIGNIN: "/auth/signin",
  SIGNOUT: "/auth/signout",
  ERROR: "/auth/error",
  RESET: "/auth/reset",
  NEW_PASSWORD: "/auth/new-password",
}

/**
 * An array of routes that are used for authentication purposes
 * @type {string[]}
 */
export const APP_AUTH_ROUTES = new Set(Object.values(AUTH_ROUTES))

/**
 * The prefix for API authentication routes
 * Routes that start with this prefix are used for API authentication purposes
 * @type {string}
 */
export const API_AUTH_ROUTE_PREFIX = "/api/auth"
export const API_TRPC_ROUTE_PREFIX = "/api/trpc"

/**
 * The default redirect path after logging in
 * @type {string}
 */
export const DEFAULT_LOGIN_REDIRECT = "/"

export const APP_NON_WORKSPACE_ROUTES = new Set(["/error"])
