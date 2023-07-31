import { NextRouter } from "next/router"
import { createClient } from "@vercel/edge-config"
import { ClassValue, clsx } from "clsx"
import ms from "ms"
import { customAlphabet } from "nanoid"
import { twMerge } from "tailwind-merge"

import { AppClaims, AppOrgClaim } from "@/lib/types"

import { SECOND_LEVEL_DOMAINS, SPECIAL_APEX_DOMAINS, ccTLDs } from "./constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getOrgsFromClaims = ({
  appClaims,
}: {
  appClaims: AppClaims
}): {
  defaultOrgSlug: string
  currentOrg: AppOrgClaim
  allOrgIds: Array<string>
  currentOrgId: string
  currentOrgSet: boolean
} => {
  const orgClaims = appClaims.organizations
  const allOrgIds: Array<string> = []

  let defaultOrgSlug = ""
  let currentOrgId = ""
  let currentOrgSet = false
  let currentOrg = {} as AppOrgClaim

  for (const key in orgClaims) {
    const org = orgClaims[key]

    // just verify is the current org is part of the orgs of the user
    if (
      appClaims.current_org?.org_slug === org.slug &&
      Object.prototype.hasOwnProperty.call(
        orgClaims,
        appClaims.current_org?.org_id
      )
    ) {
      currentOrgSet = true
      currentOrg = org
      currentOrgId = key
    }

    if (Object.prototype.hasOwnProperty.call(orgClaims, key)) {
      allOrgIds.push(key)

      if (org.is_default) {
        defaultOrgSlug = org.slug
      }
    }
  }

  return {
    defaultOrgSlug,
    currentOrg,
    allOrgIds,
    currentOrgId,
    currentOrgSet,
  }
}

export const fetchAPI = async ({
  url,
  data,
  method = "GET",
}: {
  url: string
  method: string
  data?: any
}) => {
  let payload = {}

  if (method !== "GET") {
    payload = {
      method,
      headers: new Headers({ "Content-Type": "application/json" }),
      credentials: "same-origin",
      body: JSON.stringify(data),
    }
  }

  const res: Response = await fetch(url, payload)

  if (!res.ok) {
    const message = await res.json()
    throw Error(JSON.stringify(message))
  }

  return res.json()
}

export const getEnv = (): string => {
  const env =
    process.env.NEXT_PUBLIC_VERCEL_ENV === "production" ? "production" : "test"

  return env
}

export const getAppRootUrl = () => {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    "http://app.localhost:3000/"

  // Make sure to include `https://` when not localhost.
  url = url.includes("http") ? url : `https://${url}`

  // Make sure to not including trailing `/`.
  url = url.endsWith("/") ? url.slice(0, -1) : url
  return url
}

export function createSlug(data: string) {
  return data
    .toLowerCase()
    .trim()
    .replace(/[\W_]+/g, "-")
}

export const nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  7
) // 7-character random string

interface SWRError extends Error {
  status: number
}

export async function fetcher<JSON = any>(
  input: RequestInfo,
  init?: RequestInit
): Promise<JSON> {
  const res = await fetch(input, init)

  if (!res.ok) {
    const json = await res.json()
    if (json.error) {
      const error = new Error(json.error) as SWRError
      error.status = res.status
      throw error
    } else {
      throw new Error("An unexpected error occurred")
    }
  }

  return res.json()
}

export function nFormatter(num: number, digits?: number) {
  if (!num) return "0"
  const lookup = [
    { value: 1, symbol: "" },
    { value: 1e3, symbol: "K" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "G" },
    { value: 1e12, symbol: "T" },
    { value: 1e15, symbol: "P" },
    { value: 1e18, symbol: "E" },
  ]
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/
  var item = lookup
    .slice()
    .reverse()
    .find(function (item) {
      return num >= item.value
    })
  return item
    ? (num / item.value).toFixed(digits || 1).replace(rx, "$1") + item.symbol
    : "0"
}

export function capitalize(str: string) {
  if (!str || typeof str !== "string") return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function linkConstructor({
  key,
  domain = "dub.sh",
  localhost,
  pretty,
  noDomain,
}: {
  key: string
  domain?: string
  localhost?: boolean
  pretty?: boolean
  noDomain?: boolean
}) {
  const link = `${localhost ? "http://localhost:3000" : `https://${domain}`}${
    key !== "_root" ? `/${key}` : ""
  }`

  if (noDomain) return `/${key}`
  return pretty ? link.replace(/^https?:\/\//, "") : link
}

export const timeAgo = (timestamp: Date, timeOnly?: boolean): string => {
  if (!timestamp) return "never"
  return `${ms(Date.now() - new Date(timestamp).getTime())}${
    timeOnly ? "" : " ago"
  }`
}

export const getDateTimeLocal = (timestamp?: Date): string => {
  const d = timestamp ? new Date(timestamp) : new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .split(":")
    .slice(0, 2)
    .join(":")
}

export const toDateTime = (secs: number) => {
  var t = new Date("1970-01-01T00:30:00Z") // Unix epoch start.
  t.setSeconds(secs)
  return t
}

export const getFirstAndLastDay = (day: number) => {
  const today = new Date()
  const currentDay = today.getDate()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  if (currentDay >= day) {
    // if the current day is greater than target day, it means that we just passed it
    return {
      firstDay: new Date(currentYear, currentMonth, day),
      lastDay: new Date(currentYear, currentMonth + 1, day - 1),
    }
  } else {
    // if the current day is less than target day, it means that we haven't passed it yet
    const lastYear = currentMonth === 0 ? currentYear - 1 : currentYear // if the current month is January, we need to go back a year
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1 // if the current month is January, we need to go back to December
    return {
      firstDay: new Date(lastYear, lastMonth, day),
      lastDay: new Date(currentYear, currentMonth, day - 1),
    }
  }
}

export const generateDomainFromName = (name: string) => {
  const normalizedName = name
    .toLowerCase()
    .trim()
    .replace(/[\W_]+/g, "")
  if (normalizedName.length < 3) {
    return ""
  }
  if (ccTLDs.has(normalizedName.slice(-2))) {
    return `${normalizedName.slice(0, -2)}.${normalizedName.slice(-2)}`
  }
  // remove vowels
  const devowel = normalizedName.replace(/[aeiou]/g, "")
  if (devowel.length >= 3 && ccTLDs.has(devowel.slice(-2))) {
    return `${devowel.slice(0, -2)}.${devowel.slice(-2)}`
  }

  const shortestString = [normalizedName, devowel].reduce((a, b) =>
    a.length < b.length ? a : b
  )

  return `${shortestString}.to`
}

export const validDomainRegex = new RegExp(
  "^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$"
)

export const getSubdomain = (name: string, apexName: string) => {
  if (name === apexName) return null
  return name.slice(0, name.length - apexName.length - 1)
}

export const getApexDomain = (url: string) => {
  let domain
  try {
    domain = new URL(url).hostname
  } catch (e) {
    return ""
  }
  // special apex domains (e.g. youtu.be)
  if (SPECIAL_APEX_DOMAINS[domain]) return SPECIAL_APEX_DOMAINS[domain]

  const parts = domain.split(".")
  if (parts.length > 2) {
    // if this is a second-level TLD (e.g. co.uk, .com.ua, .org.tt), we need to return the last 3 parts
    if (
      SECOND_LEVEL_DOMAINS.has(parts[parts.length - 2]) &&
      ccTLDs.has(parts[parts.length - 1])
    ) {
      return parts.slice(-3).join(".")
    }
    // otherwise, it's a subdomain (e.g. dub.vercel.app), so we return the last 2 parts
    return parts.slice(-2).join(".")
  }
  // if it's a normal domain (e.g. dub.sh), we return the domain
  return domain
}

export const isValidUrl = (url: string) => {
  try {
    new URL(url)
    return true
  } catch (e) {
    return false
  }
}

export const getUrlFromString = (str: string) => {
  if (isValidUrl(str)) return str
  try {
    if (str.includes(".") && !str.includes(" ")) {
      return new URL(`https://${str}`).toString()
    }
  } catch (e) {
    return null
  }
}

export const getDomainWithoutWWW = (url: string) => {
  if (isValidUrl(url)) {
    return new URL(url).hostname.replace(/^www\./, "")
  }
  try {
    if (url.includes(".") && !url.includes(" ")) {
      return new URL(`https://${url}`).hostname.replace(/^www\./, "")
    }
  } catch (e) {
    return undefined
  }
}

export const getQueryString = (router: NextRouter) => {
  const { slug: omit, ...queryWithoutSlug } = router.query as {
    slug: string
    [key: string]: string
  }
  const queryString = new URLSearchParams(queryWithoutSlug).toString()
  return `${queryString ? "?" : ""}${queryString}`
}

export const truncate = (str: string, length: number) => {
  if (!str || str.length <= length) return str
  return `${str.slice(0, length)}...`
}

export const getParamsFromURL = (url: string) => {
  if (!url) return {}
  try {
    const params = new URL(url).searchParams
    const paramsObj: Record<string, string> = {}
    for (const [key, value] of params.entries()) {
      if (value && value !== "") {
        paramsObj[key] = value
      }
    }
    return paramsObj
  } catch (e) {
    return {}
  }
}

export const constructURLFromUTMParams = (
  url: string,
  utmParams: Record<string, string>
) => {
  if (!url) return ""
  try {
    const newURL = new URL(url)
    for (const [key, value] of Object.entries(utmParams)) {
      if (value === "") {
        newURL.searchParams.delete(key)
      } else {
        newURL.searchParams.set(key, value)
      }
    }
    return newURL.toString()
  } catch (e) {
    return ""
  }
}

export const paramsMetadata = [
  { display: "UTM Source", key: "utm_source", examples: "twitter, facebook" },
  { display: "UTM Medium", key: "utm_medium", examples: "social, email" },
  { display: "UTM Campaign", key: "utm_campaign", examples: "summer_sale" },
  { display: "UTM Term", key: "utm_term", examples: "blue_shoes" },
  { display: "UTM Content", key: "utm_content", examples: "logolink" },
]

export const getUrlWithoutUTMParams = (url: string) => {
  try {
    const newURL = new URL(url)
    paramsMetadata.forEach((param) => newURL.searchParams.delete(param.key))
    return newURL.toString()
  } catch (e) {
    return url
  }
}

const logTypeToEnv = {
  cron: process.env.DUB_SLACK_HOOK_CRON,
  links: process.env.DUB_SLACK_HOOK_LINKS,
}

export const log = async (message: string, type: "cron" | "links") => {
  /* Log a message to the console */
  const HOOK = logTypeToEnv[type]
  if (!HOOK) return
  try {
    return await fetch(HOOK, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: message,
            },
          },
        ],
      }),
    })
  } catch (e) {
    console.log(`Failed to log to Dub Slack. Error: ${e}`)
  }
}

export const edgeConfig = createClient(
  `https://edge-config.vercel.com/ecfg_eh6zdvznm70adch6q0mqxshrt4ny?token=64aef40c-ea06-4aeb-b528-b94d924ec05a`
)

export const getBlackListedDomains = async () => {
  try {
    const domains = (await edgeConfig.get("domains")) as []
    return domains || []
  } catch (e) {
    return []
  }
}

export const isBlacklistedDomain = async (domain: string) => {
  const blacklistedDomains = await getBlackListedDomains()
  return new RegExp(blacklistedDomains.join("|")).test(
    getDomainWithoutWWW(domain) ?? ""
  )
}

export const getBlackListedEmails = async () => {
  try {
    const emails = (await edgeConfig.get("emails")) as string
    if (emails) {
      return new Set(emails)
    } else {
      return new Set()
    }
  } catch (e) {
    return new Set()
  }
}

export const timezones = {
  "Asia/Barnaul": "RU",
  "Africa/Nouakchott": "MR",
  "Africa/Lusaka": "ZM",
  "Asia/Pyongyang": "KP",
  "Europe/Bratislava": "SK",
  "America/Belize": "BZ",
  "America/Maceio": "BR",
  "Pacific/Chuuk": "FM",
  "Indian/Comoro": "KM",
  "Pacific/Palau": "PW",
  "Asia/Jakarta": "ID",
  "Africa/Windhoek": "NA",
  "America/Chihuahua": "MX",
  "America/Nome": "US",
  "Africa/Mbabane": "SZ",
  "Africa/Porto-Novo": "BJ",
  "Europe/San_Marino": "SM",
  "Pacific/Fakaofo": "TK",
  "America/Denver": "US",
  "Europe/Belgrade": "RS",
  "America/Indiana/Tell_City": "US",
  "America/Fortaleza": "BR",
  "America/Halifax": "CA",
  "Europe/Bucharest": "RO",
  "America/Indiana/Petersburg": "US",
  "Europe/Kirov": "RU",
  "Europe/Athens": "GR",
  "America/Argentina/Ushuaia": "AR",
  "Europe/Monaco": "MC",
  "Europe/Vilnius": "LT",
  "Europe/Copenhagen": "DK",
  "Pacific/Kanton": "KI",
  "America/Caracas": "VE",
  "Asia/Almaty": "KZ",
  "Europe/Paris": "FR",
  "Africa/Blantyre": "MW",
  "Asia/Muscat": "OM",
  "America/North_Dakota/Beulah": "US",
  "America/Matamoros": "MX",
  "Asia/Irkutsk": "RU",
  "America/Costa_Rica": "CR",
  "America/Araguaina": "BR",
  "Atlantic/Canary": "ES",
  "America/Santo_Domingo": "DO",
  "America/Vancouver": "CA",
  "Africa/Addis_Ababa": "ET",
  "Africa/Accra": "GH",
  "Pacific/Kwajalein": "MH",
  "Asia/Baghdad": "IQ",
  "Australia/Adelaide": "AU",
  "Australia/Hobart": "AU",
  "America/Guayaquil": "EC",
  "America/Argentina/Tucuman": "AR",
  "Australia/Lindeman": "AU",
  "America/New_York": "US",
  "Pacific/Fiji": "FJ",
  "America/Antigua": "AG",
  "Africa/Casablanca": "MA",
  "America/Paramaribo": "SR",
  "Africa/Cairo": "EG",
  "America/Cayenne": "GF",
  "America/Detroit": "US",
  "Antarctica/Syowa": "AQ",
  "Africa/Douala": "CM",
  "America/Argentina/La_Rioja": "AR",
  "Africa/Lagos": "NG",
  "America/St_Barthelemy": "BL",
  "Asia/Nicosia": "CY",
  "Asia/Macau": "MO",
  "Europe/Riga": "LV",
  "Asia/Ashgabat": "TM",
  "Indian/Antananarivo": "MG",
  "America/Argentina/San_Juan": "AR",
  "Asia/Aden": "YE",
  "Asia/Tomsk": "RU",
  "America/Asuncion": "PY",
  "Pacific/Bougainville": "PG",
  "Asia/Vientiane": "LA",
  "America/Mazatlan": "MX",
  "Africa/Luanda": "AO",
  "Europe/Oslo": "NO",
  "Africa/Kinshasa": "CD",
  "Europe/Warsaw": "PL",
  "America/Grand_Turk": "TC",
  "Asia/Seoul": "KR",
  "Africa/Tripoli": "LY",
  "America/St_Thomas": "VI",
  "Asia/Kathmandu": "NP",
  "Pacific/Pitcairn": "PN",
  "Pacific/Nauru": "NR",
  "America/Curacao": "CW",
  "Asia/Kabul": "AF",
  "Pacific/Tongatapu": "TO",
  "Europe/Simferopol": "UA",
  "Asia/Ust-Nera": "RU",
  "Africa/Mogadishu": "SO",
  "Indian/Mayotte": "YT",
  "Pacific/Niue": "NU",
  "America/Thunder_Bay": "CA",
  "Atlantic/Azores": "PT",
  "Pacific/Gambier": "PF",
  "Europe/Stockholm": "SE",
  "Africa/Libreville": "GA",
  "America/Punta_Arenas": "CL",
  "America/Guatemala": "GT",
  "America/Noronha": "BR",
  "Europe/Helsinki": "FI",
  "Asia/Gaza": "PS",
  "Pacific/Kosrae": "FM",
  "America/Aruba": "AW",
  "America/Nassau": "BS",
  "Asia/Choibalsan": "MN",
  "America/Winnipeg": "CA",
  "America/Anguilla": "AI",
  "Asia/Thimphu": "BT",
  "Asia/Beirut": "LB",
  "Atlantic/Faroe": "FO",
  "Europe/Berlin": "DE",
  "Europe/Amsterdam": "NL",
  "Pacific/Honolulu": "US",
  "America/Regina": "CA",
  "America/Scoresbysund": "GL",
  "Europe/Vienna": "AT",
  "Europe/Tirane": "AL",
  "Africa/El_Aaiun": "EH",
  "America/Creston": "CA",
  "Asia/Qostanay": "KZ",
  "Asia/Ho_Chi_Minh": "VN",
  "Europe/Samara": "RU",
  "Europe/Rome": "IT",
  "Australia/Eucla": "AU",
  "America/El_Salvador": "SV",
  "America/Chicago": "US",
  "Africa/Abidjan": "CI",
  "Asia/Kamchatka": "RU",
  "Pacific/Tarawa": "KI",
  "America/Santiago": "CL",
  "America/Bahia": "BR",
  "Indian/Christmas": "CX",
  "Asia/Atyrau": "KZ",
  "Asia/Dushanbe": "TJ",
  "Europe/Ulyanovsk": "RU",
  "America/Yellowknife": "CA",
  "America/Recife": "BR",
  "Australia/Sydney": "AU",
  "America/Fort_Nelson": "CA",
  "Pacific/Efate": "VU",
  "Europe/Saratov": "RU",
  "Africa/Banjul": "GM",
  "Asia/Omsk": "RU",
  "Europe/Ljubljana": "SI",
  "Europe/Budapest": "HU",
  "Europe/Astrakhan": "RU",
  "America/Argentina/Buenos_Aires": "AR",
  "Pacific/Chatham": "NZ",
  "America/Argentina/Salta": "AR",
  "Africa/Niamey": "NE",
  "Asia/Pontianak": "ID",
  "Indian/Reunion": "RE",
  "Asia/Hong_Kong": "HK",
  "Antarctica/McMurdo": "AQ",
  "Africa/Malabo": "GQ",
  "America/Los_Angeles": "US",
  "America/Argentina/Cordoba": "AR",
  "Pacific/Pohnpei": "FM",
  "America/Tijuana": "MX",
  "America/Campo_Grande": "BR",
  "America/Dawson_Creek": "CA",
  "Asia/Novosibirsk": "RU",
  "Pacific/Pago_Pago": "AS",
  "Asia/Jerusalem": "IL",
  "Europe/Sarajevo": "BA",
  "Africa/Freetown": "SL",
  "Asia/Yekaterinburg": "RU",
  "America/Juneau": "US",
  "Africa/Ouagadougou": "BF",
  "Africa/Monrovia": "LR",
  "Europe/Kiev": "UA",
  "America/Argentina/San_Luis": "AR",
  "Asia/Tokyo": "JP",
  "Asia/Qatar": "QA",
  "America/La_Paz": "BO",
  "America/Bogota": "CO",
  "America/Thule": "GL",
  "Asia/Manila": "PH",
  "Asia/Hovd": "MN",
  "Asia/Tehran": "IR",
  "Atlantic/Madeira": "PT",
  "America/Metlakatla": "US",
  "Europe/Vatican": "VA",
  "Asia/Bishkek": "KG",
  "Asia/Dili": "TL",
  "Antarctica/Palmer": "AQ",
  "Atlantic/Cape_Verde": "CV",
  "Indian/Chagos": "IO",
  "America/Kentucky/Monticello": "US",
  "Africa/Algiers": "DZ",
  "Africa/Maseru": "LS",
  "Asia/Kuala_Lumpur": "MY",
  "Africa/Khartoum": "SD",
  "America/Argentina/Rio_Gallegos": "AR",
  "America/Blanc-Sablon": "CA",
  "Africa/Maputo": "MZ",
  "America/Tortola": "VG",
  "Atlantic/Bermuda": "BM",
  "America/Argentina/Catamarca": "AR",
  "America/Cayman": "KY",
  "America/Puerto_Rico": "PR",
  "Pacific/Majuro": "MH",
  "Europe/Busingen": "DE",
  "Pacific/Midway": "UM",
  "Indian/Cocos": "CC",
  "Asia/Singapore": "SG",
  "America/Boise": "US",
  "America/Nuuk": "GL",
  "America/Goose_Bay": "CA",
  "Australia/Broken_Hill": "AU",
  "Africa/Dar_es_Salaam": "TZ",
  "Africa/Asmara": "ER",
  "Asia/Samarkand": "UZ",
  "Asia/Tbilisi": "GE",
  "America/Argentina/Jujuy": "AR",
  "America/Indiana/Winamac": "US",
  "America/Porto_Velho": "BR",
  "Asia/Magadan": "RU",
  "Europe/Zaporozhye": "UA",
  "Antarctica/Casey": "AQ",
  "Asia/Shanghai": "CN",
  "Pacific/Norfolk": "NF",
  "Europe/Guernsey": "GG",
  "Australia/Brisbane": "AU",
  "Antarctica/DumontDUrville": "AQ",
  "America/Havana": "CU",
  "America/Atikokan": "CA",
  "America/Mexico_City": "MX",
  "America/Rankin_Inlet": "CA",
  "America/Cuiaba": "BR",
  "America/Resolute": "CA",
  "Africa/Ceuta": "ES",
  "Arctic/Longyearbyen": "SJ",
  "Pacific/Guam": "GU",
  "Asia/Damascus": "SY",
  "Asia/Colombo": "LK",
  "Asia/Yerevan": "AM",
  "America/Montserrat": "MS",
  "America/Belem": "BR",
  "Europe/Kaliningrad": "RU",
  "Atlantic/South_Georgia": "GS",
  "Asia/Tashkent": "UZ",
  "Asia/Kolkata": "IN",
  "America/St_Johns": "CA",
  "Asia/Srednekolymsk": "RU",
  "Asia/Yakutsk": "RU",
  "Europe/Prague": "CZ",
  "Africa/Djibouti": "DJ",
  "Asia/Dubai": "AE",
  "Europe/Uzhgorod": "UA",
  "America/Edmonton": "CA",
  "Asia/Famagusta": "CY",
  "America/Indiana/Knox": "US",
  "Asia/Hebron": "PS",
  "Asia/Taipei": "TW",
  "Europe/London": "GB",
  "Africa/Dakar": "SN",
  "Australia/Darwin": "AU",
  "America/Glace_Bay": "CA",
  "Antarctica/Vostok": "AQ",
  "America/Indiana/Vincennes": "US",
  "America/Nipigon": "CA",
  "Asia/Kuwait": "KW",
  "Pacific/Guadalcanal": "SB",
  "America/Toronto": "CA",
  "Africa/Gaborone": "BW",
  "Africa/Bujumbura": "BI",
  "Africa/Lubumbashi": "CD",
  "America/Merida": "MX",
  "America/Marigot": "MF",
  "Europe/Zagreb": "HR",
  "Pacific/Easter": "CL",
  "America/Santarem": "BR",
  "Pacific/Noumea": "NC",
  "America/Sitka": "US",
  "Atlantic/Stanley": "FK",
  "Pacific/Funafuti": "TV",
  "America/Iqaluit": "CA",
  "America/Rainy_River": "CA",
  "America/Anchorage": "US",
  "America/Lima": "PE",
  "Asia/Baku": "AZ",
  "America/Indiana/Vevay": "US",
  "Asia/Ulaanbaatar": "MN",
  "America/Managua": "NI",
  "Asia/Krasnoyarsk": "RU",
  "Asia/Qyzylorda": "KZ",
  "America/Eirunepe": "BR",
  "Europe/Podgorica": "ME",
  "Europe/Chisinau": "MD",
  "Europe/Mariehamn": "AX",
  "Europe/Volgograd": "RU",
  "Africa/Nairobi": "KE",
  "Europe/Isle_of_Man": "IM",
  "America/Menominee": "US",
  "Africa/Harare": "ZW",
  "Asia/Anadyr": "RU",
  "America/Moncton": "CA",
  "Indian/Maldives": "MV",
  "America/Whitehorse": "CA",
  "Antarctica/Mawson": "AQ",
  "Europe/Madrid": "ES",
  "America/Argentina/Mendoza": "AR",
  "America/Manaus": "BR",
  "Africa/Bangui": "CF",
  "Indian/Mauritius": "MU",
  "Africa/Tunis": "TN",
  "Australia/Lord_Howe": "AU",
  "America/Kentucky/Louisville": "US",
  "America/North_Dakota/Center": "US",
  "Asia/Novokuznetsk": "RU",
  "Asia/Makassar": "ID",
  "America/Port_of_Spain": "TT",
  "America/Bahia_Banderas": "MX",
  "Pacific/Auckland": "NZ",
  "America/Sao_Paulo": "BR",
  "Asia/Dhaka": "BD",
  "America/Pangnirtung": "CA",
  "Europe/Dublin": "IE",
  "Asia/Brunei": "BN",
  "Africa/Brazzaville": "CG",
  "America/Montevideo": "UY",
  "America/Jamaica": "JM",
  "America/Indiana/Indianapolis": "US",
  "America/Kralendijk": "BQ",
  "Europe/Gibraltar": "GI",
  "Pacific/Marquesas": "PF",
  "Pacific/Apia": "WS",
  "Europe/Jersey": "JE",
  "America/Phoenix": "US",
  "Africa/Ndjamena": "TD",
  "Asia/Karachi": "PK",
  "Africa/Kampala": "UG",
  "Asia/Sakhalin": "RU",
  "America/Martinique": "MQ",
  "Europe/Moscow": "RU",
  "Africa/Conakry": "GN",
  "America/Barbados": "BB",
  "Africa/Lome": "TG",
  "America/Ojinaga": "MX",
  "America/Tegucigalpa": "HN",
  "Asia/Bangkok": "TH",
  "Africa/Johannesburg": "ZA",
  "Europe/Vaduz": "LI",
  "Africa/Sao_Tome": "ST",
  "America/Cambridge_Bay": "CA",
  "America/Lower_Princes": "SX",
  "America/Miquelon": "PM",
  "America/St_Kitts": "KN",
  "Australia/Melbourne": "AU",
  "Europe/Minsk": "BY",
  "Asia/Vladivostok": "RU",
  "Europe/Sofia": "BG",
  "Antarctica/Davis": "AQ",
  "Pacific/Galapagos": "EC",
  "America/North_Dakota/New_Salem": "US",
  "Asia/Amman": "JO",
  "Pacific/Wallis": "WF",
  "America/Hermosillo": "MX",
  "Pacific/Kiritimati": "KI",
  "Antarctica/Macquarie": "AU",
  "America/Guyana": "GY",
  "Asia/Riyadh": "SA",
  "Pacific/Tahiti": "PF",
  "America/St_Vincent": "VC",
  "America/Cancun": "MX",
  "America/Grenada": "GD",
  "Pacific/Wake": "UM",
  "America/Dawson": "CA",
  "Europe/Brussels": "BE",
  "Indian/Kerguelen": "TF",
  "America/Yakutat": "US",
  "Indian/Mahe": "SC",
  "Atlantic/Reykjavik": "IS",
  "America/Panama": "PA",
  "America/Guadeloupe": "GP",
  "Europe/Malta": "MT",
  "Antarctica/Troll": "AQ",
  "Asia/Jayapura": "ID",
  "Asia/Bahrain": "BH",
  "Asia/Chita": "RU",
  "Europe/Tallinn": "EE",
  "Asia/Khandyga": "RU",
  "America/Rio_Branco": "BR",
  "Atlantic/St_Helena": "SH",
  "Africa/Juba": "SS",
  "America/Adak": "US",
  "Pacific/Saipan": "MP",
  "America/St_Lucia": "LC",
  "America/Inuvik": "CA",
  "Europe/Luxembourg": "LU",
  "Africa/Bissau": "GW",
  "Asia/Oral": "KZ",
  "America/Boa_Vista": "BR",
  "Europe/Skopje": "MK",
  "America/Port-au-Prince": "HT",
  "Pacific/Port_Moresby": "PG",
  "Europe/Andorra": "AD",
  "America/Indiana/Marengo": "US",
  "Africa/Kigali": "RW",
  "Africa/Bamako": "ML",
  "America/Dominica": "DM",
  "Asia/Aqtobe": "KZ",
  "Europe/Istanbul": "TR",
  "Pacific/Rarotonga": "CK",
  "America/Danmarkshavn": "GL",
  "Europe/Zurich": "CH",
  "Asia/Yangon": "MM",
  "America/Monterrey": "MX",
  "Europe/Lisbon": "PT",
  "Asia/Kuching": "MY",
  "Antarctica/Rothera": "AQ",
  "Australia/Perth": "AU",
  "Asia/Phnom_Penh": "KH",
  "America/Swift_Current": "CA",
  "Asia/Aqtau": "KZ",
  "Asia/Urumqi": "CN",
}
