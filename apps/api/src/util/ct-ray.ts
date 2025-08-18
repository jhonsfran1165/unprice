import {
  type ParserReturn,
  type RegionCloudflare,
  regionsCloudflare,
} from "@unprice/analytics/utils"

export function parseCfRay(header: string): ParserReturn<RegionCloudflare> {
  console.info("header", header)
  const regex = /\b([A-Z]{3})\b/g
  const arr = header.match(regex)

  if (!arr || !Array.isArray(arr) || arr.length === 0) {
    return { status: "failed", error: "Couldn't parse the header." }
  }
  console.info("arr", arr)

  const region = regionsCloudflare[arr[0]]
  console.info("region", region)
  if (region) return { status: "success", data: region }

  return {
    status: "failed",
    error: `It seems like the data center '${arr[0]}' (iata) is not listed.`,
  }
}
