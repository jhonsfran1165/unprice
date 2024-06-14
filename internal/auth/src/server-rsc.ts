import "server-only"

import type { DefaultSession, User } from "next-auth"
import { cache } from "react"

import type { WorkspacesJWTPayload } from "@builderai/db/validators"

import NextAuth from "."
import { authConfig } from "./config"

export type { DefaultSession as DefaultAuthSession, Session } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      workspaces: WorkspacesJWTPayload[]
    } & DefaultSession["user"]
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser extends User {
    workspaces?: WorkspacesJWTPayload[]
  }
}

const {
  handlers: { GET, POST },
  auth: defaultAuth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
})

/**
 * This is the main way to get session data for your RSCs.
 * This will de-duplicate all calls to next-auth's default `auth()` function and only call it once per request
 */
const auth = cache(defaultAuth)

export { GET, POST, auth, signIn, signOut }
// TODO: check this https://github.com/juliusmarminge/trellix-trpc/blob/main/src/auth/index.tsx
