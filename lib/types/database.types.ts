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
          created_at: string
          updated_at: string
          name: string
          slug: string
          image: string | null
          type: string
        }
        Insert: {
          id?: number
          created_at?: string
          updated_at?: string
          name: string
          slug?: string
          image?: string | null
          type?: string
        }
        Update: {
          id?: number
          created_at?: string
          updated_at?: string
          name?: string
          slug?: string
          image?: string | null
          type?: string
        }
      }
      organization_profiles: {
        Row: {
          id: number
          created_at: string
          updated_at: string
          role: string
          profile_id: string
          org_id: number
          is_default: boolean
        }
        Insert: {
          id?: number
          created_at?: string
          updated_at?: string
          role?: string
          profile_id: string
          org_id: number
          is_default?: boolean
        }
        Update: {
          id?: number
          created_at?: string
          updated_at?: string
          role?: string
          profile_id?: string
          org_id?: number
          is_default?: boolean
        }
      }
      page: {
        Row: {
          id: number
          created_at: string
          title: string
          description: string
          content: Json | null
          image_url: string | null
          published: boolean
          org_id: number | null
          site_id: number | null
          slug: string
        }
        Insert: {
          id?: number
          created_at?: string
          title: string
          description: string
          content?: Json | null
          image_url?: string | null
          published?: boolean
          org_id?: number | null
          site_id?: number | null
          slug?: string
        }
        Update: {
          id?: number
          created_at?: string
          title?: string
          description?: string
          content?: Json | null
          image_url?: string | null
          published?: boolean
          org_id?: number | null
          site_id?: number | null
          slug?: string
        }
      }
      profile: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          username: string
          full_name: string
          avatar_url: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          username: string
          full_name: string
          avatar_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          username?: string
          full_name?: string
          avatar_url?: string | null
        }
      }
      site: {
        Row: {
          id: number
          logo: string | null
          name: string
          created_at: string
          updated_at: string
          custom_domain: string | null
          subdomain: string
          org_id: number | null
          slug: string
        }
        Insert: {
          id?: number
          logo?: string | null
          name: string
          created_at?: string
          updated_at?: string
          custom_domain?: string | null
          subdomain: string
          org_id?: number | null
          slug?: string
        }
        Update: {
          id?: number
          logo?: string | null
          name?: string
          created_at?: string
          updated_at?: string
          custom_domain?: string | null
          subdomain?: string
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

