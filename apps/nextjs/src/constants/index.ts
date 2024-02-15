export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Builderai"

export const SHORT_DOMAIN = process.env.NEXT_PUBLIC_APP_SHORT_DOMAIN ?? "dub.sh"

export const APP_HOSTNAMES = new Set([
  `app.${process.env.NEXT_PUBLIC_APP_DOMAIN}`,
  `preview.${process.env.NEXT_PUBLIC_APP_DOMAIN}`,
  "app.localhost:3000",
  "localhost",
])

export const API_HOSTNAMES = new Set([
  `api.${process.env.NEXT_PUBLIC_APP_DOMAIN}`,
  `api.${SHORT_DOMAIN}`,
  "api.localhost:3000",
])

export const SITES_HOSTNAMES = new Set([
  `sites.${process.env.NEXT_PUBLIC_APP_DOMAIN}`,
  `sites.${SHORT_DOMAIN}`,
  "sites.localhost:3000",
])

/**
 * An array of routes that are accessible to the public
 * These routes do not require authentication
 * @type {string[]}
 */
export const APP_PUBLIC_ROUTES = new Set([
  "/opengraph-image.png",
  "/terms",
  "/pricing",
  "/privacy",
])

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

/**
 * The default redirect path after logging in
 * @type {string}
 */
export const DEFAULT_LOGIN_REDIRECT = "/"

export const APP_NON_WORKSPACE_ROUTES = new Set(["/error"])

export const COOKIE_NAME_WORKSPACE = "workspace-slug"
