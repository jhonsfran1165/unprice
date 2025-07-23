import type { AnalyticsEvent } from "@unprice/tinybird"
import { analytics } from "@unprice/tinybird/client"

/**
 * Post event to Tinybird HFI
 *
 * @param  { string } event Event object
 * @return { Promise<string> } Tinybird HFI response
 */
const _postEvent = async (event: {
  action: AnalyticsEvent["action"]
  version: string
  session_id: string
  timestamp: string
  payload: string
}): Promise<{
  successful_rows: number
  quarantined_rows: number
}> => {
  try {
    const payload = JSON.parse(event.payload)

    const eventPayload = {
      ...event,
      payload,
    }

    const response = await analytics.ingestEvents(eventPayload)

    return response
  } catch (error) {
    console.error(error)
    return {
      successful_rows: 0,
      quarantined_rows: 0,
    }
  }
}

export async function POST(req: Request) {
  const body = await req.json()
  const response = await _postEvent(body)
  return new Response(JSON.stringify(response), {
    headers: {
      "access-control-allow-credentials": "true",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "OPTIONS,POST",
      "access-control-allow-headers":
        "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
      "content-type": "text/html",
    },
  })
}
