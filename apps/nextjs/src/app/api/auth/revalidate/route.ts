import { NextResponse } from "next/server"

export const runtime = "edge"
export const preferredRegion = ["fra1"]

import { auth, unstable_update } from "@unprice/auth/server"
import { workspacesByUserPrepared } from "@unprice/db/queries"

const handler = auth(async (req) => {
  const session = req.auth

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
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

  return NextResponse.json({ message: "ok" }, { status: 200 })
})

export { handler as GET }
