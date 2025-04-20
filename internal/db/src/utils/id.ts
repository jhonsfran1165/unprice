import baseX from "base-x"

const b58 = baseX("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz")

export const prefixes = {
  workspace: "ws",
  ingestion: "ing",
  request: "req",
  project: "proj",
  user: "usr",
  feature: "ft",
  feature_version: "fv",
  plan: "plan",
  apikey: "api",
  apikey_key: "unprice_live",
  page: "page",
  customer: "cus",
  customer_credit: "cc",
  customer_session: "cs",
  customer_provider: "cp",
  customer_entitlement: "ce",
  subscription: "sub",
  subscription_item: "si",
  subscription_phase: "sp",
  domain: "dom",
  plan_version: "pv",
  usage: "usage",
  log: "log",
  invoice: "inv",
  payment_provider_config: "ppc",
  isolate: "iso",
} as const

// Thread-local counter for monotonicity within the same millisecond
let lastTimestamp = BigInt(0)
let counter = 0

// Constants
const EPOCH_TIMESTAMP = BigInt(1_700_000_000_000)
const MAX_COUNTER = 0xfff // 12 bits for counter

// BigInt constants
const BIGINT_255 = BigInt(255)
const BIGINT_40 = BigInt(40)
const BIGINT_32 = BigInt(32)
const BIGINT_24 = BigInt(24)
const BIGINT_16 = BigInt(16)
const BIGINT_8 = BigInt(8)

/**
 * Generates a unique, time-sortable ID with prefix
 * Structure (16 bytes total):
 * - 6 bytes: timestamp (48 bits)
 * - 2 bytes: counter/variation (16 bits)
 * - 8 bytes: random data (64 bits)
 */
export function newId<TPrefix extends keyof typeof prefixes>(
  prefix: TPrefix
): `${(typeof prefixes)[TPrefix]}_${string}` {
  // Initialize buffer with zeros
  const buf = new Uint8Array(16) // 128 bits like a UUID v7

  // First, fill the entire buffer with random values
  crypto.getRandomValues(buf)

  // Get current timestamp in milliseconds
  const timestamp = BigInt(Date.now()) - EPOCH_TIMESTAMP

  // Ensure monotonicity with counter overflow protection
  if (timestamp === lastTimestamp) {
    if (counter >= MAX_COUNTER) {
      // Wait for next millisecond if counter would overflow
      while (BigInt(Date.now()) - EPOCH_TIMESTAMP === lastTimestamp) {
        // Busy-wait
      }
      counter = 0
      lastTimestamp = BigInt(Date.now()) - EPOCH_TIMESTAMP
    } else {
      counter++
    }
  } else {
    counter = 0
    lastTimestamp = timestamp
  }

  // Write 48-bit timestamp
  buf[0] = Number((timestamp >> BIGINT_40) & BIGINT_255)
  buf[1] = Number((timestamp >> BIGINT_32) & BIGINT_255)
  buf[2] = Number((timestamp >> BIGINT_24) & BIGINT_255)
  buf[3] = Number((timestamp >> BIGINT_16) & BIGINT_255)
  buf[4] = Number((timestamp >> BIGINT_8) & BIGINT_255)
  buf[5] = Number(timestamp & BIGINT_255)

  // Write 16-bit counter/variation with version
  buf[6] = (0x7 << 4) | ((counter >> 8) & 0x0f) // Version 7 in high nibble
  buf[7] = counter & 0xff

  // Set variant bits (RFC 4122 variant)
  buf[8] = (buf[8]! & 0x3f) | 0x80

  return `${prefixes[prefix]}_${b58.encode(buf)}` as const
}

/**
 * Extracts the timestamp from an ID
 * @param id The ID to extract timestamp from
 * @returns timestamp in milliseconds since EPOCH_TIMESTAMP
 */
export function getTimestampFromId(id: string): number {
  const [, encodedPart] = id.split("_")
  const buf = b58.decode(encodedPart!)

  // Ensure buffer is the correct length
  if (buf.length < 6) {
    throw new Error("Invalid ID format: buffer too short")
  }

  const timestamp =
    (BigInt(buf[0]!) << BIGINT_40) |
    (BigInt(buf[1]!) << BIGINT_32) |
    (BigInt(buf[2]!) << BIGINT_24) |
    (BigInt(buf[3]!) << BIGINT_16) |
    (BigInt(buf[4]!) << BIGINT_8) |
    BigInt(buf[5]!)

  return Number(timestamp + EPOCH_TIMESTAMP)
}

/**
 * Utility function to compare two IDs chronologically
 * @returns negative if a < b, 0 if equal, positive if a > b
 */
export function compareIds(a: string, b: string): number {
  const timestampA = getTimestampFromId(a)
  const timestampB = getTimestampFromId(b)

  if (timestampA !== timestampB) {
    return timestampA - timestampB
  }

  // If timestamps are equal, compare encoded parts to maintain consistent ordering
  const [, encodedA] = a.split("_")
  const [, encodedB] = b.split("_")
  return encodedA!.localeCompare(encodedB!)
}
