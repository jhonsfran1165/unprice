import {
  NextFetchEvent,
  NextRequest,
  NextResponse,
  userAgent,
} from "next/server"

import { LOCALHOST_GEO_DATA } from "@/lib/constants"
import { detectBot, parse } from "@/lib/middleware/utils"
import { publishPageHits } from "@/lib/tinybird/publish"
import { capitalize } from "@/lib/utils"
import { analyticSchema } from "@/lib/validations/analytic"

export const config = {
  runtime: "edge",
}

// TODO: clean
export default async function handler(req: NextRequest, ev: NextFetchEvent) {
  try {
    if (req.method === "POST") {
      // TODO: abstract logic in tinybird index? so we can do the same from middleware
      const { ip } = parse(req)
      const isBot = detectBot(req)
      // TODO: validate schema with zod
      const data = await req.json()
      const ua = userAgent(req)
      const geo = process.env.VERCEL === "1" ? req.geo : LOCALHOST_GEO_DATA

      // TODO: get properties explicitly
      const pageViewObject = {
        ...data,
        country: geo?.country || "Unknown",
        city: geo?.city || "Unknown",
        region: geo?.region || "Unknown",
        latitude: geo?.latitude || "Unknown",
        longitude: geo?.longitude || "Unknown",
        browser: ua.browser.name || "Unknown",
        browser_version: ua.browser.version || "Unknown",
        engine: ua.engine.name || "Unknown",
        engine_version: ua.engine.version || "Unknown",
        os: ua.os.name || "Unknown",
        os_version: ua.os.version || "Unknown",
        device: ua.device.type ? capitalize(ua.device.type) : "Desktop",
        device_vendor: ua.device.vendor || "Unknown",
        device_model: ua.device.model || "Unknown",
        cpu_architecture: ua.cpu?.architecture || "Unknown",
        bot: isBot,
        ip: req.headers.get("x-real-ip") || ip,
        mobile: req.headers.get("sec-ch-ua-mobile"),
        useragent: req.headers.get("user-agent"),
      }

      // TODO: send a log to tinybird here if error
      ev.waitUntil(
        publishPageHits(pageViewObject).catch((json) => console.log({ json }))
      )

      return new Response("on builderai we trust", { status: 200 })
    } else {
      return new Response(`Method ${req.method} Not Allowed`, { status: 405 })
    }
  } catch (error) {
    return NextResponse.json({ error: "Error sending stats" }, { status: 400 })
  }
}
