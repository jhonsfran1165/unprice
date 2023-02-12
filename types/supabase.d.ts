import type { Database } from "./database.types"

export type { User } from "@supabase/supabase-js"

export type Organization = Database["public"]["Tables"]["organization"]["Row"]
export type Page = Database["public"]["Tables"]["page"]["Row"]
export type Profile = Database["public"]["Tables"]["profile"]["Row"]
export type Site = Database["public"]["Tables"]["site"]["Row"]
export type SiteUsers = Database["public"]["Tables"]["site_users"]["Row"]
