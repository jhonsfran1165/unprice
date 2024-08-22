"use server"

import { unstable_update } from "@unprice/auth/server"
import { getSession } from "@unprice/auth/server-rsc"
import { workspacesByUserPrepared } from "@unprice/db/queries"

export async function updateSession() {
  const session = await getSession()

  if (!session?.user) {
    return
  }

  const userWithWorkspaces = await workspacesByUserPrepared.execute({
    userId: session?.user.id,
  })

  const workspaces = userWithWorkspaces?.members.map((member) => ({
    id: member.workspace.id,
    slug: member.workspace.slug,
    role: member.role,
    isPersonal: member.workspace.isPersonal,
    enabled: member.workspace.enabled,
    unPriceCustomerId: member.workspace.unPriceCustomerId,
  }))

  // update the session with the new workspace
  await unstable_update({
    user: {
      id: session?.user.id,
      workspaces: workspaces,
    },
  })
}
