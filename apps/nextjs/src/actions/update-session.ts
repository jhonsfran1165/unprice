"use server"

import { unstable_update } from "@unprice/auth/server"
import { getSession } from "@unprice/auth/server-rsc"

export async function updateSession() {
  const session = await getSession()
  // this will trigger a refresh of the workspaces for the user
  await unstable_update({
    user: {
      id: session?.user.id,
    },
  })
}
