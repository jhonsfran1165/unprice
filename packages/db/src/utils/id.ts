// INFO: https://unkey.dev/blog/uuid-ux

import { customAlphabet } from "nanoid"

import { dbNameSpaces } from "./constants"

export const nanoid = customAlphabet(
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
)

export function newId(prefix: keyof typeof dbNameSpaces): string {
  return [dbNameSpaces[prefix], nanoid(16)].join("_")
}
