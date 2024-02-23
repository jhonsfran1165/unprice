export * from "./_table"
export * from "./constants"
export * from "./id"
export * from "./id-edge"
export * from "./sql"

export { generateSlug } from "random-word-slugs"

export function createSlug(data: string) {
  return data
    .toLowerCase()
    .trim()
    .replace(/[\W_]+/g, "-")
}
