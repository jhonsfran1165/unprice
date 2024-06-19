import { type Dinero, allocate, toSnapshot, transformScale, up } from "dinero.js"

export * from "./utils/_table"
export * from "./utils/constants"
export * from "./utils/id"

export { generateSlug } from "random-word-slugs"

export function slugify(data: string) {
  return data
    .toLowerCase()
    .trim()
    .replace(/[\W_]+/g, "-")
}

export async function hashStringSHA256(str: string) {
  // Encode the string into bytes
  const encoder = new TextEncoder()
  const data = encoder.encode(str)

  // Hash the data with SHA-256
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)

  // Convert the buffer to a hexadecimal string
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

  return hashHex
}

export function toStripeMoney(price: Dinero<number>) {
  const { currency } = toSnapshot(price)

  // we need to return the amount in cents rounded up to the nearest cent
  const currencyScaleMoney = transformScale(price, currency.exponent, up)

  const { amount } = toSnapshot(currencyScaleMoney)

  return { amount, currency: currency.code.toLowerCase() }
}

export function calculatePercentage(price: Dinero<number>, percentage: number) {
  const str = percentage.toString()
  const scale = str.split(".")[1]?.length ?? 0
  const rest = percentage * 10 ** scale
  const total = 1 * 10 ** scale

  const ratios = [
    { amount: Math.round(rest), scale: scale },
    { amount: Math.round(total) - Math.round(rest), scale: scale },
  ]

  const [result] = allocate(price, ratios)

  return result!
}
