export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      organization: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image: string | null
          name: string
          slug: string
          stripe_id: string | null
          type: Database["public"]["Enums"]["organization_type"] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          name: string
          slug?: string
          stripe_id?: string | null
          type?: Database["public"]["Enums"]["organization_type"] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          name?: string
          slug?: string
          stripe_id?: string | null
          type?: Database["public"]["Enums"]["organization_type"] | null
          updated_at?: string
        }
      }
      organization_profiles: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          org_id: string
          profile_id: string
          role: Database["public"]["Enums"]["organization_roles"] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          org_id: string
          profile_id: string
          role?: Database["public"]["Enums"]["organization_roles"] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          org_id?: string
          profile_id?: string
          role?: Database["public"]["Enums"]["organization_roles"] | null
          updated_at?: string
        }
      }
      organization_subscriptions: {
        Row: {
          cancel_at: string | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created: string
          currency: string | null
          current_period_end: string
          current_period_start: string
          ended_at: string | null
          id: string
          interval: Database["public"]["Enums"]["subscription_interval"] | null
          interval_count: number | null
          metadata: Json | null
          org_id: string | null
          price_id: string | null
          quantity: number | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          tier: Database["public"]["Enums"]["organization_tiers"] | null
          trial_end: string | null
          trial_start: string | null
        }
        Insert: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created?: string
          currency?: string | null
          current_period_end?: string
          current_period_start?: string
          ended_at?: string | null
          id?: string
          interval?: Database["public"]["Enums"]["subscription_interval"] | null
          interval_count?: number | null
          metadata?: Json | null
          org_id?: string | null
          price_id?: string | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          tier?: Database["public"]["Enums"]["organization_tiers"] | null
          trial_end?: string | null
          trial_start?: string | null
        }
        Update: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created?: string
          currency?: string | null
          current_period_end?: string
          current_period_start?: string
          ended_at?: string | null
          id?: string
          interval?: Database["public"]["Enums"]["subscription_interval"] | null
          interval_count?: number | null
          metadata?: Json | null
          org_id?: string | null
          price_id?: string | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          tier?: Database["public"]["Enums"]["organization_tiers"] | null
          trial_end?: string | null
          trial_start?: string | null
        }
      }
      page: {
        Row: {
          content: Json | null
          created_at: string
          description: string
          id: string
          image_url: string | null
          org_id: string | null
          project_id: string | null
          published: boolean
          slug: string
          title: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          org_id?: string | null
          project_id?: string | null
          published?: boolean
          slug?: string
          title: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          org_id?: string | null
          project_id?: string | null
          published?: boolean
          slug?: string
          title?: string
        }
      }
      profile: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
          username?: string
        }
      }
      project: {
        Row: {
          created_at: string
          custom_domain: string | null
          description: string | null
          id: string
          logo: string | null
          name: string
          org_id: string | null
          slug: string
          subdomain: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_domain?: string | null
          description?: string | null
          id?: string
          logo?: string | null
          name: string
          org_id?: string | null
          slug?: string
          subdomain: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_domain?: string | null
          description?: string | null
          id?: string
          logo?: string | null
          name?: string
          org_id?: string | null
          slug?: string
          subdomain?: string
          updated_at?: string
        }
      }
    }
    Views: {
      data_orgs: {
        Row: {
          is_default: boolean | null
          org_id: string | null
          org_image: string | null
          org_slug: string | null
          org_stripe_id: string | null
          org_type: Database["public"]["Enums"]["organization_type"] | null
          profile_id: string | null
          profiles_org_id: string | null
          role: Database["public"]["Enums"]["organization_roles"] | null
          status_subscription:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          subscription_canceled_at: string | null
          subscription_ended_at: string | null
          subscription_interval:
            | Database["public"]["Enums"]["subscription_interval"]
            | null
          subscription_interval_count: number | null
          subscription_metadata: Json | null
          subscription_period_ends: string | null
          subscription_period_starts: string | null
          subscription_trial_ends: string | null
          subscription_trial_starts: string | null
          tier: string | null
        }
      }
    }
    Functions: {
      config_org:
        | {
            Args: {
              user_id: string
              org_id: string
              slug: string
              type: Database["public"]["Enums"]["organization_type"]
              name: string
              image: string
              description: string
              role_user: Database["public"]["Enums"]["organization_roles"]
              tier: string
              is_default: boolean
            }
            Returns: string
          }
        | {
            Args: {
              user_id: string
              org_id: string
              slug: string
              type: Database["public"]["Enums"]["organization_type"]
              name: string
              image: string
              description: string
              role_user: Database["public"]["Enums"]["organization_roles"]
            }
            Returns: string
          }
      custom_exception: {
        Args: {
          message: string
        }
        Returns: boolean
      }
      delete_claim: {
        Args: {
          uid: string
          claim: string
        }
        Returns: string
      }
      get_claim: {
        Args: {
          user_id: string
          claim: string
        }
        Returns: Json
      }
      get_claims: {
        Args: {
          user_id: string
        }
        Returns: Json
      }
      get_my_jwt_claim: {
        Args: {
          claim: string
        }
        Returns: Json
      }
      get_my_jwt_claims: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      has_role_org: {
        Args: {
          org_id: string
          role: string
        }
        Returns: boolean
      }
      is_claims_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_member_of: {
        Args: {
          _user_id: string
          _organization_id: string
        }
        Returns: boolean
      }
      is_member_org: {
        Args: {
          org_id: string
        }
        Returns: boolean
      }
      is_role_of: {
        Args: {
          _user_id: string
          _org_id: string
          _role: string
        }
        Returns: boolean
      }
      jwt_expired_exception: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      no_admin_exception: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      no_owner_exception: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      set_claim: {
        Args: {
          uid: string
          claim: string
          value: Json
        }
        Returns: string
      }
    }
    Enums: {
      organization_roles: "OWNER" | "MEMBER"
      organization_tiers: "FREE" | "PRO" | "CUSTOM"
      organization_type: "STARTUP" | "PERSONAL" | "BUSSINESS"
      subscription_interval: "day" | "week" | "month" | "year"
      subscription_status:
        | "trialing"
        | "active"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "past_due"
        | "unpaid"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          public: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          path_tokens: string[] | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: {
          bucketid: string
          name: string
          owner: string
          metadata: Json
        }
        Returns: undefined
      }
      extension: {
        Args: {
          name: string
        }
        Returns: string
      }
      filename: {
        Args: {
          name: string
        }
        Returns: string
      }
      foldername: {
        Args: {
          name: string
        }
        Returns: string[]
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          size: number
          bucket_id: string
        }[]
      }
      search: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

