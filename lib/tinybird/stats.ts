export type IntervalProps = "1h" | "24h" | "7d" | "30d" | "90d" | "all"

export const INTERVALS = [
  {
    display: "Last hour",
    slug: "1h",
  },
  {
    display: "Last 24 hours",
    slug: "24h",
  },
  {
    display: "Last 7 days",
    slug: "7d",
  },
  {
    display: "Last 30 days",
    slug: "30d",
  },
  {
    display: "Last 3 months",
    slug: "90d",
  },
  {
    display: "All Time",
    slug: "all",
  },
]

export const intervalData = {
  "1h": {
    startDate: new Date(Date.now() - 3600000),
    granularity: "minute",
  },
  "24h": {
    startDate: new Date(Date.now() - 86400000),
    granularity: "hour",
  },
  "7d": {
    startDate: new Date(Date.now() - 604800000),
    granularity: "day",
  },
  "30d": {
    startDate: new Date(Date.now() - 2592000000),
    granularity: "day",
  },
  "90d": {
    startDate: new Date(Date.now() - 7776000000),
    granularity: "month",
  },
  all: {
    // Dub.sh founding date
    startDate: new Date("2022-09-22"),
    granularity: "month",
  },
}

export type LocationTabs = "country" | "city" | "region"

export type DeviceTabs = "device" | "browser" | "os" | "bot" | "ua"

export const uaToBot = (ua: string): string => {
  if (!ua) return "Unknown Bot"
  if (ua.includes("curl")) {
    return "Curl Request"
  } else if (ua.includes("Slackbot")) {
    return "Slack Bot"
  } else if (ua.includes("Twitterbot")) {
    return "Twitter Bot"
  } else if (ua.includes("facebookexternalhit")) {
    return "Facebook Bot"
  } else if (ua.includes("LinkedInBot")) {
    return "LinkedIn Bot"
  } else if (ua.includes("WhatsApp")) {
    return "WhatsApp Bot"
  } else if (ua.includes("TelegramBot")) {
    return "Telegram Bot"
  } else if (ua.includes("Discordbot")) {
    return "Discord Bot"
  } else if (ua.includes("Googlebot")) {
    return "Google Bot"
  } else if (ua.includes("Baiduspider")) {
    return "Baidu Bot"
  } else if (ua.includes("bingbot")) {
    return "Bing Bot"
  } else if (ua.includes("YandexBot")) {
    return "Yandex Bot"
  } else if (ua.includes("DuckDuckBot")) {
    return "DuckDuckGo Bot"
  } else {
    return "Unknown Bot"
  }
}

const VALID_TINYBIRD_ENDPOINTS = new Set([
  "timeseries",
  "clicks",
  "country",
  "city",
  "device",
  "browser",
  "os",
  "bot",
  "referer",
])
