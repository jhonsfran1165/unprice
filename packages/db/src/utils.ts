export * from "./utils/_table"
export * from "./utils/constants"
export * from "./utils/id"
export * from "./utils/id-edge"

export { generateSlug } from "random-word-slugs"

export function slugify(data: string) {
  return data
    .toLowerCase()
    .trim()
    .replace(/[\W_]+/g, "-")
}
