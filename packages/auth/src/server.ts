import type { DefaultSession, User } from "next-auth"

import type { WorkspacesJWTPayload } from "@builderai/db/validators"

import NextAuth from "."
import { authConfig } from "./config"

export type { DefaultSession as DefaultAuthSession, Session } from "next-auth"

export type { NextAuthRequest } from "next-auth/lib"

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

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
})
