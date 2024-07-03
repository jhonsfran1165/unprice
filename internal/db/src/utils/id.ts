import baseX from "base-x"

const b58 = baseX("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz")

// sortable ids use fewer resources and are more efficient
export const prefixes = {
  workspace: "ws",
  ingestion: "ing",
  request: "req",
  project: "proj",
  user: "user",
  feature: "feat",
  feature_version: "fv",
  plan: "plan",
  apikey: "api",
  apikey_key: "builderai_live",
  page: "page",
  customer: "cus",
  customer_provider: "cusp",
  subscription: "sub",
  subscription_item: "subi",
  domain: "dom",
  plan_version: "pv",
  usage: "usage",
  log: "log",
} as const

export function newId<TPrefix extends keyof typeof prefixes>(prefix: TPrefix) {
  const buf = crypto.getRandomValues(new Uint8Array(20))

  /**
   * epoch starts more recently so that the 32-bit number space gives a
   * significantly higher useful lifetime of around 136 years
   * from 2023-11-14T22:13:20.000Z to 2159-12-22T04:41:36.000Z.
   */
  const EPOCH_TIMESTAMP = 1_700_000_000_000

  const t = Date.now() - EPOCH_TIMESTAMP

  buf[0] = (t >>> 24) & 255
  buf[1] = (t >>> 16) & 255
  buf[2] = (t >>> 8) & 255
  buf[3] = t & 255

  return `${prefixes[prefix]}_${b58.encode(buf)}` as const
}
