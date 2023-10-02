import { auth } from "@builderai/auth"

/**
 * Return the tenant id or a 404 not found page.
 *
 * The auth check should already be done at a higher level, and we're just returning 404 to make typescript happy.
 */
export function getActiveTenantId(): string {
  const { userId, orgId } = auth()
  return orgId ?? userId ?? ""
}

export function getActiveTenantSlug(): string {
  const { sessionClaims, orgSlug } = auth()

  const tenantSlug = orgSlug ? orgSlug : (sessionClaims?.username as string)

  return tenantSlug
}

export function getTenantOrgsSlug(): object {
  const { sessionClaims } = auth()

  return sessionClaims ?? {}
}
