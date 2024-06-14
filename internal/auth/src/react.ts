import type { DefaultSession } from "next-auth"
import type { SessionContextValue } from "next-auth/react"
import { useSession as useAuthSession } from "next-auth/react"

import type { WorkspacesJWTPayload } from "@builderai/db/validators"

export { SessionProvider, signIn, signOut } from "next-auth/react"

interface Session extends DefaultSession {
  user?: DefaultSession["user"] & {
    id: string
    workspaces: WorkspacesJWTPayload[]
  }
}

// @ts-expect-error Hacking the type so we don't have to do the module augmentation technique.
export const useSession: () => Session & SessionContextValue = useAuthSession
