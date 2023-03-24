export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organization: {
        Row: {
          id: number
          created_at: string | null
          updated_at: string | null
          name: string | null
          slug: string
        }
        Insert: {
          id?: number
          created_at?: string | null
          updated_at?: string | null
          name?: string | null
          slug?: string
        }
        Update: {
          id?: number
          created_at?: string | null
          updated_at?: string | null
          name?: string | null
          slug?: string
        }
      }
      organization_profiles: {
        Row: {
          id: number
          created_at: string | null
          updated_at: string | null
          role: string | null
          profile_id: string
          org_id: number
          is_default: boolean | null
        }
        Insert: {
          id?: number
          created_at?: string | null
          updated_at?: string | null
          role?: string | null
          profile_id: string
          org_id: number
          is_default?: boolean | null
        }
        Update: {
          id?: number
          created_at?: string | null
          updated_at?: string | null
          role?: string | null
          profile_id?: string
          org_id?: number
          is_default?: boolean | null
        }
      }
      page: {
        Row: {
          id: number
          created_at: string | null
          title: string | null
          description: string | null
          content: Json | null
          image_url: string | null
          published: boolean | null
          org_id: number | null
          site_id: number | null
          slug: string
        }
        Insert: {
          id?: number
          created_at?: string | null
          title?: string | null
          description?: string | null
          content?: Json | null
          image_url?: string | null
          published?: boolean | null
          org_id?: number | null
          site_id?: number | null
          slug?: string
        }
        Update: {
          id?: number
          created_at?: string | null
          title?: string | null
          description?: string | null
          content?: Json | null
          image_url?: string | null
          published?: boolean | null
          org_id?: number | null
          site_id?: number | null
          slug?: string
        }
      }
      profile: {
        Row: {
          id: string
          created_at: string | null
          updated_at: string | null
          username: string | null
          full_name: string | null
          avatar_url: string | null
        }
        Insert: {
          id: string
          created_at?: string | null
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string | null
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
        }
      }
      site: {
        Row: {
          id: number
          logo: string | null
          name: string | null
          created_at: string | null
          updated_at: string | null
          custom_domain: string | null
          subdomain: string | null
          org_id: number | null
          slug: string
        }
        Insert: {
          id?: number
          logo?: string | null
          name?: string | null
          created_at?: string | null
          updated_at?: string | null
          custom_domain?: string | null
          subdomain?: string | null
          org_id?: number | null
          slug?: string
        }
        Update: {
          id?: number
          logo?: string | null
          name?: string | null
          created_at?: string | null
          updated_at?: string | null
          custom_domain?: string | null
          subdomain?: string | null
          org_id?: number | null
          slug?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

