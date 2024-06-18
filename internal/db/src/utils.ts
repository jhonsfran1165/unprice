import { type Dinero, toSnapshot, transformScale, up } from "dinero.js"

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

export function toStripeMoney(dineroObject: Dinero<number>) {
  const { currency } = toSnapshot(dineroObject)

  // we need to return the amount in cents rounded to the nearest cent
  const currencyScaleMoney = transformScale(dineroObject, currency.exponent, up)

  const { amount } = toSnapshot(currencyScaleMoney)

  return { amount, currency: currency.code.toLowerCase() }
}
