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

const auth = defaultAuth

export { GET, POST, auth, signIn, signOut }
