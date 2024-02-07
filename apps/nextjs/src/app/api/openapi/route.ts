import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

// import { generateOpenApiDocument } from "trpc-openapi"

// import type { AppRouter } from "@builderai/api"
// import { appRouter } from "@builderai/api"

export async function GET(req: NextRequest) {
  // console.log(
  //   generateOpenApiDocument(appRouter, {
  //     title: "tRPC OpenAPI",
  //     version: "1.0.0",
  //     baseUrl: "http://app.localhost:3000/api",
  //   })
  // )

  console.log("GET /api/openapi")

  return NextResponse.json(
    {
      data: "pong",
    },
    { status: 200 }
  )
}
