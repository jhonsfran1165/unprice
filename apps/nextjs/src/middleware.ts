import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { authMiddleware } from "@builderai/auth/server"

const before = (req: NextRequest) => {
  const url = req.nextUrl.clone()

  if (url.pathname.includes("api/trpc")) {
    return NextResponse.next()
  }

  // TODO: add middleware to check the subdomain

  return NextResponse.next()
}

export default authMiddleware({
  signInUrl: "/signin",
  publicRoutes: [
    "/",
    "/opengraph-image.png",
    "/signin(.*)",
    "/sso-callback(.*)",
    "/terms(.*)",
    "/pricing(.*)",
    "/privacy(.*)",
    "/api(.*)",
  ],
  beforeAuth: before,
  debug: false,
  async afterAuth(auth, req) {
    // if (auth.isPublicRoute) {
    //   // Don't do anything for public routes
    //   return NextResponse.next()
    // }

    // const url = new URL(req.nextUrl.origin)
    // const parts = req.nextUrl.pathname.split("/").filter(Boolean)

    // if (!auth.userId) {
    //   // User is not signed in
    //   url.pathname = "/signin"
    //   return NextResponse.redirect(url)
    // }

    // if (req.nextUrl.pathname === "/dashboard") {
    //   // /dashboard should redirect to the user's dashboard
    //   // use their current workspace, i.e. /:orgId or /:userId
    //   url.pathname = `/${auth.orgSlug ?? auth.sessionClaims.username}`

    //   console.log(url.pathname)
    //   return NextResponse.redirect(url)
    // }

    // /**
    //  * TODO: I'd prefer not showing the ID in the URL but
    //  * a more friendly looking slug. For example,
    //  * /org_foo34213 -> /foo
    //  * /user_bar123/project_acm234231sfsdfa -> /bar/baz
    //  */

    // /**
    //  * TODO: Decide if redirects should 404 or redirect to /
    //  */

    // const workspaceSlug = parts[0]
    // const isOrg = workspaceSlug?.startsWith("org_")
    // if (isOrg && auth.orgId !== workspaceSlug) {
    //   // User is accessing an org that's not their active one
    //   // Check if they have access to it
    //   const orgs = await clerkClient.users.getOrganizationMembershipList({
    //     userId: auth.userId,
    //   })
    //   const hasAccess = orgs.some((org) => org.id === workspaceSlug)
    //   if (!hasAccess) {
    //     url.pathname = `/`
    //     return NextResponse.redirect(url)
    //   }

    //   // User has access to the org, let them pass.
    //   // TODO: Set the active org to the one they're accessing
    //   // so that we don't need to do this client-side.
    //   // This is currently not possible with Clerk but will be.
    //   return NextResponse.next()
    // }

    // const isUser = workspaceSlug?.startsWith("user_")
    // if (isUser && auth.userId !== workspaceSlug) {
    //   // User is accessing a user that's not them
    //   url.pathname = `/`
    //   return NextResponse.redirect(url)
    // }

    return NextResponse.next()
  },
})

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
}
