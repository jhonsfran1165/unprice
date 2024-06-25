import "server-only"

import type { WorkspacesJWTPayload } from "@builderai/db/validators"
import type { DefaultSession, User } from "next-auth"

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
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
})

export { GET, POST, signIn, signOut, auth }
