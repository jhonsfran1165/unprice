import type { Session } from "@builderai/auth/server"

export function getWorkspacesUser(session: Session | null): {
  user?: Session["user"]
  userBelongsToWorkspace: (workspaceSlug: string) => boolean
} {
  const userSession = session?.user

  const userBelongsToWorkspace = (workspaceSlug: string) =>
    userSession?.workspaces.some((workspace) => workspace.slug === workspaceSlug) ?? false

  return {
    user: userSession,
    userBelongsToWorkspace,
  }
}
