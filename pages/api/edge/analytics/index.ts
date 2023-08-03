import { NextFetchEvent, NextRequest, NextResponse } from "next/server"
import * as z from "zod"

import { recordEvent, recordPageView } from "@/lib/tinybird"
import { newId } from "@/lib/utils/id-edge"
import {
  analyticApiSchema,
  payloadEventSchema,
  payloadPageViewSchema,
} from "@/lib/validations/analytic"

export const config = {
  runtime: "edge",
  // TODO: find the best region
  // regions: 'iad1', // optional
}

export default async function handler(req: NextRequest, ev: NextFetchEvent) {
  try {
    if (req.method === "POST") {
      // validate schema of the post request
      const dataPost = await req.json()
      const { action, eventPayload } = analyticApiSchema.parse(dataPost)

      // send the proper request to tinybird given the event name
      switch (action) {
        case "trackPage":
          const pageViewId = newId("page")

          // TODO: send log if fails
          ev.waitUntil(
            recordPageView({
              req,
              pagePayload: payloadPageViewSchema.parse(eventPayload),
              id: pageViewId,
            }).catch((error) => console.log(error))
          )

          break

        case "trackEvent":
          const EventId = newId("event")

          // TODO: send log if fails
          ev.waitUntil(
            recordEvent({
              req,
              eventPayload: payloadEventSchema.parse(eventPayload),
              id: EventId,
            }).catch((error) => console.log(error))
          )

          break

        default:
          break
      }

      return new Response("on builderai we trust", { status: 200 })
    } else {
      return new Response(`Method ${req.method} Not Allowed`, { status: 405 })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify(error.issues), {
        status: 422,
      })
    }

    // TODO: send log

    return NextResponse.json({ error: "Error sending stats" }, { status: 400 })
  }
}
