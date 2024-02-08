import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { Builderai } from "@builderai/client"

import { openApiDocument } from "~/trpc/openapi"

export async function GET(_req: NextRequest) {
  const builderai = new Builderai({
    token: "builderai_live_EdDvGhWxinbLyqouUmBvZt",
    baseUrl: "http://localhost:3000/api/trpc",
    wrapperSdkVersion: `@unkey/nextjs`,
    disableTelemetry: true,
  })

  const hasAccess = await builderai.subscriptions.can({
    userId: "user_D9JFW3i3rz4a48XQMYCG8T",
    featureSlug: "login",
  })

  console.log("hasAccess", hasAccess)

  return NextResponse.json(openApiDocument, { status: 200 })
}
