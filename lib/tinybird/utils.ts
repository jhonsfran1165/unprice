import { NextRequest, userAgent } from "next/server"

import { LOCALHOST_GEO_DATA } from "@/lib/constants"
import { detectBot, parse } from "@/lib/middleware/utils"
import {
  publishClickHits,
  publishEvents,
  publishPageViews,
} from "@/lib/tinybird"
import { capitalize, getDomainWithoutWWW } from "@/lib/utils"
import {
  PayloadEventType,
  PayloadPageViewType,
} from "@/lib/validations/analytic"

/**
 * Recording clicks with geo, ua, referer and timestamp data
 * If key is not specified, record click as the root click ("_root", e.g. dub.sh, vercel.fyi)
 **/
export async function recordClickHits({
  req,
  id,
}: {
  req: NextRequest
  id: string
}) {
  const { domain, ip, key } = parse(req)
  const isBot = detectBot(req)
  const ua = userAgent(req)
  const geo = process.env.VERCEL === "1" ? req.geo : LOCALHOST_GEO_DATA
  const referer = req.headers.get("referer")
  const time = Date.now() // in milliseconds
  const timestamp = new Date(time).toISOString()

  const clickHitObject = {
    id,
    time,
    timestamp,
    domain,
    key: key || "_root",
    country: geo?.country || "Unknown",
    city: geo?.city || "Unknown",
    region: geo?.region || "Unknown",
    latitude: geo?.latitude || "Unknown",
    longitude: geo?.longitude || "Unknown",
    useragent: ua.ua || "Unknown",
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
    referer: referer ? getDomainWithoutWWW(referer) : "(direct)",
    referer_url: referer || "(direct)",
    ip: req.headers.get("x-real-ip") || ip,
    mobile: req.headers.get("sec-ch-ua-mobile") || "",
  }

  return await publishClickHits(clickHitObject)
}

export async function recordPageView({
  req,
  pagePayload,
  id,
}: {
  pagePayload: PayloadPageViewType
  req: NextRequest
  id: string
}) {
  const { domain, ip, suddomain } = parse(req)
  const isBot = detectBot(req)
  const ua = userAgent(req)
  const geo = process.env.VERCEL === "1" ? req.geo : LOCALHOST_GEO_DATA

  const time = Date.now() // in milliseconds
  const timestamp = new Date(time).toISOString()

  const {
    session_id,
    title,
    url,
    path,
    search,
    locale,
    width,
    height,
    duration,
    country,
    referer,
    referer_url,
    org_slug,
    org_id,
    project_slug,
  } = pagePayload

  const pageViewObject = {
    org_slug,
    org_id,
    project_slug,
    id,
    title,
    url,
    path,
    search,
    width,
    height,
    duration,
    time,
    timestamp,
    domain,
    suddomain,
    country,
    locale,
    session_id,
    referer,
    referer_url,
    city: geo?.city,
    region: geo?.region,
    latitude: geo?.latitude,
    longitude: geo?.longitude,
    useragent: req.headers.get("user-agent") || "",
    browser: ua.browser.name,
    browser_version: ua.browser.version,
    engine: ua.engine.name,
    engine_version: ua.engine.version,
    os: ua.os.name,
    os_version: ua.os.version,
    device: ua.device.type ? capitalize(ua.device.type) : "Desktop",
    device_vendor: ua.device.vendor,
    device_model: ua.device.model,
    cpu_architecture: ua.cpu?.architecture,
    bot: isBot,
    ip: req.headers.get("x-real-ip") || ip,
    mobile: req.headers.get("sec-ch-ua-mobile") || "",
  }

  return await publishPageViews(pageViewObject)
}

export async function recordEvent({
  eventPayload,
  id,
  req,
}: {
  eventPayload: PayloadEventType
  req: NextRequest
  id: string
}) {
  const { session_id, event_name, payload } = eventPayload

  // TODO: save in UTC?
  const time = Date.now() // in milliseconds
  const timestamp = new Date(time).toISOString()
  const { domain, suddomain } = parse(req)

  const eventObject = {
    session_id,
    suddomain,
    domain,
    event_name,
    payload: JSON.stringify(payload ?? {}),
    id,
    time,
    timestamp,
  }

  return await publishEvents(eventObject)
}
