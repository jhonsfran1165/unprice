import { auth } from "@unprice/auth/server"
import { COOKIES_APP } from "@unprice/config"
import { verifyAccess } from "flags"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { unprice } from "../../../../lib/flags"
export const runtime = "edge"
export const dynamic = "force-dynamic" // defaults to auto

export async function GET(request: NextRequest) {
  const access = await verifyAccess(request.headers.get("Authorization"))
  if (!access) return NextResponse.json(null, { status: 401 })

  const session = await auth()

  const activeWorkspaceSlug = cookies().get(COOKIES_APP.WORKSPACE)?.value ?? ""

  // Fetch live entitlements from Unprice
  const workspace = session?.user?.workspaces.find(
    (workspace) => workspace.slug === activeWorkspaceSlug
  )

  const { result } = await unprice.customers
    .getEntitlements(workspace?.unPriceCustomerId)
    .catch((error) => {
      return {
        result: {
          entitlements: [],
        },
        error: error,
      }
    })

  return NextResponse.json({
    definitions: {
      entitlements: {
        description: "Customer access entitlements",
        options: result.entitlements.map((entitlement) => ({
          value: true,
          label: entitlement.featureSlug,
        })),
      },
    },
  })
}
