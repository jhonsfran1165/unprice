interface OrganizationCreated {
  org_id: string
  org_slug: string
}

export interface AnalyticEventMap {
  organizationCreated: OrganizationCreated
}
