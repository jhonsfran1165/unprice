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

/**
 * Used to avoid query the db on every request to validate tenant
 *
 * @param tenantId string represented org id or user id
 * @returns the equivalent id of the workspace
 */
export const workspaceIdFromTenantId = (tenantId: string): string => {
  return tenantId.replace("org_", "wk_").replace("user_", "wk_")
}

/**
 * Used get a clerk user id or org id from workspace id
 *
 * @param workspaceId string represented workspaceId
 * @returns the equivalent id of the clerk tenant
 */
export const tenantIdFromWorkspaceId = (workspaceId: string): string => {
  return workspaceId.replace("wk_", "org_").replace("wk_", "user_")
}
