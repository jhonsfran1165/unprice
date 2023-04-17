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

// views
export type DataOrgsView = Database["public"]["View"]["data_orgs"]["Row"]

// custom types
export type OrganizationViewData =
  | (DataOrgsView & {
      organization: Organization
    })
  | DataOrgsView

export type ProjectsApiResult = Project & { organization: Organization }
