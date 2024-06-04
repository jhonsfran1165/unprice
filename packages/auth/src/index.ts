import NextAuth, { type Session } from "next-auth"
import type { NextRequest } from "next/server"

export interface NextAuthRequest extends NextRequest {
  auth: Session | null
}

export default NextAuth
