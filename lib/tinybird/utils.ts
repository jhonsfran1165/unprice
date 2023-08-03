import { NextRequest, userAgent } from "next/server"

import { LOCALHOST_GEO_DATA } from "@/lib/constants"
import { detectBot, parse } from "@/lib/middleware/utils"
import { publishEvents, publishPageViews } from "@/lib/tinybird"
import { capitalize, getDomainWithoutWWW, nanoid } from "@/lib/utils"
import {
  PayloadEventType,
  PayloadPageViewType,
} from "@/lib/validations/analytic"

/**
 * Recording clicks with geo, ua, referer and timestamp data
 * If key is not specified, record click as the root click ("_root", e.g. dub.sh, vercel.fyi)
 **/
// TODO: fix record click in middleware
export async function recordClickHits({
  domain,
  req,
  key,
}: {
  domain: string
  req: NextRequest
  key?: string
}) {
  const geo = process.env.VERCEL === "1" ? req.geo : LOCALHOST_GEO_DATA
  const ua = userAgent(req)
  const referer = req.headers.get("referer")
  const pageViewId = nanoid()

  console.log(pageViewId)

  // let country, locale;
  // try {
  //     const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  //     locale = (navigator.languages && navigator.languages.length) ? navigator.languages[0] : navigator.userLanguage || navigator.language || navigator.browserLanguage || 'en';
  // } catch (error) {
  //     // ignore error
  // }

  const pageViewObject = {
    id: pageViewId,
    time: new Date(Date.now()).toISOString(),
    domain: domain || "Unknown",
    key: key || "_root",
    country: geo?.country || "Unknown",
    city: geo?.city || "Unknown",
    region: geo?.region || "Unknown",
    latitude: geo?.latitude || "Unknown",
    longitude: geo?.longitude || "Unknown",
    ua: ua.ua || "Unknown",
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
    bot: ua.isBot,
    // ip: req.headers.get("x-real-ip"),
    // mobile: req.headers.get("sec-ch-ua-mobile"),
    // platform: req.headers.get("sec-ch-ua-platform"),
    // useragent: req.headers.get("user-agent"),
    referer: referer ? getDomainWithoutWWW(referer) : "(direct)",
    referer_url: referer || "(direct)",
  }

  // return await publishClickHits(pageViewObject)
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

  console.log(pagePayload)

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
