import type { Database } from "./database.types"

export type { User, Session } from "@supabase/supabase-js"

export type Organization = Database["public"]["Tables"]["organization"]["Row"]
export type OrganizationSubscriptionStatus =
  Database["public"]["Enums"]["subscription_status"]
export type OrganizationSubscriptionInterval =
  Database["public"]["Enums"]["subscription_interval"]
export type OrganizationSubscriptions =
  Database["public"]["Tables"]["organization_subscriptions"]["Row"]
export type OrganizationProfiles =
  Database["public"]["Tables"]["organization_profiles"]["Row"]
export type Page = Database["public"]["Tables"]["page"]["Row"]
export type Profile = Database["public"]["Tables"]["profile"]["Row"]
export type Project = Database["public"]["Tables"]["project"]["Row"]

export type OrganizationRoles =
  Database["public"]["Enums"]["organization_roles"]

export type OrganizationTypes = Database["public"]["Enums"]["organization_type"]

export type SubscriptionTiers =
  Database["public"]["Enums"]["organization_tiers"]

// views
export type DataOrgsView = Database["public"]["Views"]["data_orgs"]["Row"]
export type DataProjectsView =
  Database["public"]["Views"]["data_projects"]["Row"]

// custom types
export type OrganizationViewData = DataOrgsView & {
  organization: Organization
}
