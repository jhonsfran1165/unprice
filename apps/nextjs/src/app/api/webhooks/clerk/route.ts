import { headers } from "next/headers"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { handleEvent, Webhook } from "@builderai/auth"
import type { WebhookEvent } from "@builderai/auth/server"

import { env } from "~/env.mjs"

export async function POST(req: NextRequest) {
  // Get the headers
  const headerPayload = headers()

  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    })
  }

  // Get the body
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new SVIX instance with your secret.
  const wh = new Webhook(env.CLERK_WEBHOOK_SECRET)

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent

    await handleEvent(evt)

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.log(`❌ Error when handling Clerk Event: ${message}`)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
