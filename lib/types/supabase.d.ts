import type { Database } from "./database.types"

export type { User, Session } from "@supabase/supabase-js"

export type Organization = Database["public"]["Tables"]["organization"]["Row"]
export type OrganizationProfiles =
  Database["public"]["Tables"]["organization_profiles"]["Row"]
export type Page = Database["public"]["Tables"]["page"]["Row"]
export type Profile = Database["public"]["Tables"]["profile"]["Row"]
export type Site = Database["public"]["Tables"]["site"]["Row"]

interface Org {
  organization: Organization
}

export type OrganizationProfilesData = OrganizationProfiles & Org
