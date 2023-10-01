import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import type { AuthObject } from "@builderai/auth/server"
import { clerkClient } from "@builderai/auth/server"

export default async function AppMiddleware(
  req: NextRequest,
  auth: AuthObject
) {
  const url = new URL(req.nextUrl.origin)
  const parts = req.nextUrl.pathname.split("/").filter(Boolean)

  // TODO: recording page hits

  if (!auth.userId) {
    // User is not signed in
    url.pathname = "/signin"
    return NextResponse.redirect(url)
  }

  // get tenant id from clerk data
  const tenantId = auth.orgSlug
    ? auth.orgSlug
    : (auth.sessionClaims.username as string)

  if (req.nextUrl.pathname === "/") {
    // / should redirect to the user's dashboard
    // use their current workspace, i.e. /:orgSlug or /:userSlug
    url.pathname = `/${tenantId}`

    return NextResponse.redirect(url)
  } else {
    // if the url has a workspace defined lets validate it
    const workspaceSlug = parts[0]

    if (auth.sessionClaims.username === workspaceSlug) {
      return NextResponse.next()
    }

    if (tenantId === workspaceSlug) {
      return NextResponse.next()
    }

    // if the user has a org set
    if (auth.orgSlug && tenantId !== workspaceSlug) {
      // User is accessing an org that's not their active one
      // Check if they have access to it
      const orgs = await clerkClient.users.getOrganizationMembershipList({
        userId: auth.userId ?? "",
      })

      const hasAccess = orgs.some(
        (org) => org.organization.slug === workspaceSlug
      )

      if (!hasAccess) {
        url.pathname = `/`
        return NextResponse.redirect(url)
      }

      // User has access to the org, let them pass.
      // TODO: Set the active org to the one they're accessing
      // so that we don't need to do this client-side.
      // This is currently not possible with Clerk but will be.
      return NextResponse.next()
    }

    if (tenantId !== workspaceSlug) {
      // User is accessing a user that's not them
      url.pathname = `/`
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}
