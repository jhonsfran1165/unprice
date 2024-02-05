export const dbNameSpaces = {
  workspace: "ws",
  ingestion: "ingest",
  project: "proj",
  user: "user",
  feature: "feat",
  plan: "plan",
  canva: "canva",
  apikey: "api",
  apikey_key: "builderai_live",
  page: "page",
  customer: "customer",
  subscription: "sub",
  plan_version: "pv",
} as const

// Use custom alphabet without special chars for less chaotic, copy-able URLs
// Will not collide for a long long time: https://zelark.github.io/nano-id-cc/
export const customAlphabet =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz" as const
