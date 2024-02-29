import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { openApiDocument } from "~/trpc/openapi"

export function GET(_req: NextRequest) {
  return NextResponse.json(openApiDocument, { status: 200 })
}
