import { verifyAccess } from "flags"
import { type NextRequest, NextResponse } from "next/server"
import { env } from "../../../../env"
import { unprice } from "../../../../lib/unprice"
export const runtime = "edge"
export const dynamic = "force-dynamic" // defaults to auto

// Helper to determine if we're in development
const isDevelopment = env.NODE_ENV === "development"

export async function GET(request: NextRequest) {
  const access = await verifyAccess(request.headers.get("Authorization"))
  if (!access) return NextResponse.json(null, { status: 401 })

  try {
    const { result } = await unprice.projects.getFeatures()

    // Transform features into definitions for flags/next
    const definitions = result.features.reduce(
      (acc, feature) => {
        acc[feature.slug] = {
          description: feature.description,
          defaultValue: false,
          type: "boolean",
        }
        return acc
      },
      {} as Record<string, { description: string; defaultValue: boolean; type: "boolean" }>
    )

    const response = NextResponse.json({ definitions })

    // Add cache control headers only in production
    if (!isDevelopment) {
      response.headers.set("Cache-Control", "s-maxage=60")
    } else {
      // Prevent caching in development
      response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate")
    }

    return response
  } catch (error) {
    console.error("error", error)
    const response = NextResponse.json({
      definitions: {}, // Empty definitions object when there's an error
    })

    // Add cache headers even for error responses in production
    if (!isDevelopment) {
      response.headers.set("Cache-Control", "s-maxage=60")
    } else {
      response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate")
    }

    return response
  }
}
