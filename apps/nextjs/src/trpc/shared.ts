export { transformer } from "@builderai/api/transformer"

export const getBaseUrl = () => {
  if (typeof window !== "undefined") return ""
  const vc = process.env.VERCEL_URL
  if (vc) return `https://${vc}`
  return `http://localhost:3000`
}

// lambdas keys must match the first part of the path
export const lambdas = ["stripe", "ingestion"]
